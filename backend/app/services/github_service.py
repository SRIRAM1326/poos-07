import base64
import datetime
import hashlib
import secrets
import time
from typing import Optional

import requests
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import GitHubAccount, GitHubRepository, GitHubSyncLog, OAuthState, User

GITHUB_API = "https://api.github.com"
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"

GITHUB_SCOPES = "read:user,public_repo"

GITHUB_REPOS_PAGE_SIZE = 100
GITHUB_SEARCH_CAP = 1000
GITHUB_STATE_TTL_MINUTES = 10
GITHUB_ACTIVE_REPO_DAYS = 90
# Automatic (webhook/periodic) sync throttling. A full sync issues ~10 GitHub
# search API calls (limit: 30/min with a token) plus a number of core API calls,
# so we only auto-refresh an account after its last sync is older than these
# cooldowns. Manual "Sync GitHub" clicks are never throttled.
AUTO_SYNC_MIN_INTERVAL_SECONDS = 120
PERIODIC_SYNC_MIN_INTERVAL_SECONDS = 300
OWNED_REPO_STATS_MAX = 30
PER_REPO_SEARCH_MAX = 7
# Language byte counts are fetched per-repo, so cap the number of repos we hit to
# avoid exhausting the GitHub API rate limit for users with large repo counts.
LANGUAGE_FETCH_REPO_MAX = 30

SCORE_WEIGHTS = {
    "commits": 10,
    "merged_prs": 35,
    "issues_closed": 20,
    "code_reviews": 5,
}

SEARCH_MEDIA_TYPE = "application/vnd.github.cloak-preview+json"


def _encryption_key() -> bytes:
    configured = (settings.GITHUB_TOKEN_ENCRYPTION_KEY or "").strip()
    raw = configured if configured else settings.SECRET_KEY
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_token(plain_text: str) -> str:
    return Fernet(_encryption_key()).encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_token(cipher_text: str) -> str:
    return Fernet(_encryption_key()).decrypt(cipher_text.encode("utf-8")).decode("utf-8")


def _auth_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _search_headers(access_token: str) -> dict:
    headers = _auth_headers(access_token)
    headers["Accept"] = SEARCH_MEDIA_TYPE
    return headers


def _search_count(access_token: str, query: str, commits: bool = False) -> int:
    url = f"{GITHUB_API}/search/commits" if commits else f"{GITHUB_API}/search/issues"
    response = requests.get(
        url,
        params={"q": query, "per_page": 1},
        headers=_search_headers(access_token),
        timeout=20,
    )
    if response.status_code != 200:
        return 0
    return int(response.json().get("total_count", 0) or 0)


def _totals(access_token: str, login: str) -> dict:
    queries = {
        "commits": (f"author:{login}", True),
        "prs_total": (f"author:{login} type:pr", False),
        "prs_merged": (f"author:{login} type:pr is:merged", False),
        "prs_open": (f"author:{login} type:pr state:open", False),
        "prs_closed": (f"author:{login} type:pr is:closed is:unmerged", False),
        "issues_closed": (f"author:{login} type:issue state:closed", False),
        "issues_open": (f"author:{login} type:issue state:open", False),
        "code_reviews": (f"reviewed-by:{login} type:pr", False),
        "reviews_approved": (f"reviewed-by:{login} type:pr review:approved", False),
        "reviews_changes_requested": (f"reviewed-by:{login} type:pr review:changes_requested", False),
    }
    totals = {}
    capped = False
    for key, (query, is_commit) in queries.items():
        count = _search_count(access_token, query, commits=is_commit)
        if count > GITHUB_SEARCH_CAP:
            capped = True
        totals[key] = count
    totals["search_capped"] = capped
    return totals


def _repo_stats(access_token: str, owner_login: str, repo_name: str, github_user_id: int) -> dict:
    url = f"{GITHUB_API}/repos/{owner_login}/{repo_name}/stats/contributors"
    try:
        response = requests.get(url, headers=_auth_headers(access_token), timeout=20)
    except requests.RequestException:
        return {"commits": 0, "additions": 0, "deletions": 0}
    if response.status_code != 200:
        return {"commits": 0, "additions": 0, "deletions": 0}
    stats = {"commits": 0, "additions": 0, "deletions": 0}
    try:
        contributors = response.json()
    except ValueError:
        return stats
    for contributor in contributors or []:
        author = contributor.get("author") or {}
        if author.get("id") != github_user_id:
            continue
        stats["commits"] = int(contributor.get("total", 0) or 0)
        for week in contributor.get("weeks", []) or []:
            stats["additions"] += int(week.get("a", 0) or 0)
            stats["deletions"] += int(week.get("d", 0) or 0)
        break
    return stats


def _per_repo_search_stats(access_token: str, login: str, owner_login: str, repo_name: str) -> dict:
    repo_filter = f"repo:{owner_login}/{repo_name}"
    return {
        "prs": _search_count(access_token, f"{repo_filter} author:{login} type:pr"),
        "issues_solved": _search_count(access_token, f"{repo_filter} author:{login} type:issue state:closed"),
        "reviews": _search_count(access_token, f"{repo_filter} reviewed-by:{login} type:pr"),
    }


def compute_contribution_score(totals: dict) -> int:
    return (
        int(totals.get("commits", 0) or 0) * SCORE_WEIGHTS["commits"]
        + int(totals.get("prs_merged", 0) or 0) * SCORE_WEIGHTS["merged_prs"]
        + int(totals.get("issues_closed", 0) or 0) * SCORE_WEIGHTS["issues_closed"]
        + int(totals.get("code_reviews", 0) or 0) * SCORE_WEIGHTS["code_reviews"]
    )


def should_auto_sync(account: GitHubAccount, min_interval_seconds: int = AUTO_SYNC_MIN_INTERVAL_SECONDS) -> bool:
    """Return True when an automatic (non-manual) sync is allowed for this account.

    Automatic syncs are triggered by GitHub webhooks and by the periodic
    background task. They are throttled by a per-account cooldown so rapid push
    storms or high-volume events do not exhaust the GitHub API rate limit.
    """
    if not account.is_connected:
        return False
    if account.last_sync_at is None:
        return True
    elapsed = (datetime.datetime.utcnow() - account.last_sync_at).total_seconds()
    return elapsed >= min_interval_seconds


def _parse_iso(value) -> datetime.datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed
        return parsed.replace(tzinfo=None)
    except ValueError:
        return None


def _get_rate_limit_info(response: requests.Response) -> dict:
    """Extract rate limit headers from a GitHub API response."""
    return {
        "remaining": int(response.headers.get("X-RateLimit-Remaining", 0) or 0),
        "reset_at": _parse_iso(response.headers.get("X-RateLimit-Reset")),
    }


def _get_repo_languages(access_token: str, owner_login: str, repo_name: str) -> dict:
    """Fetch byte-count languages for a single repo. Returns {lang: bytes}."""
    url = f"{GITHUB_API}/repos/{owner_login}/{repo_name}/languages"
    try:
        response = requests.get(url, headers=_auth_headers(access_token), timeout=15)
        if response.status_code == 200:
            return response.json() or {}
    except requests.RequestException:
        pass
    return {}


def _aggregate_languages(repos: list) -> dict:
    """Aggregate language bytes across repos. Returns {lang: bytes} and total."""
    combined: dict[str, int] = {}
    for repo in repos:
        lang_data = repo.languages_json or {}
        for lang, bytes_count in lang_data.items():
            combined[lang] = combined.get(lang, 0) + int(bytes_count or 0)
    return combined


def _languages_to_percentages(raw: dict) -> list:
    """Convert raw bytes dict to sorted percentage list. Returns [{name, bytes, percentage}]."""
    total = sum(raw.values())
    if total == 0:
        return []
    items = []
    for lang, byte_count in sorted(raw.items(), key=lambda x: x[1], reverse=True):
        items.append({
            "name": lang,
            "bytes": byte_count,
            "percentage": round(byte_count / total * 100, 1),
        })
    return items


def _commit_activity(access_token: str, owner_login: str, repo_name: str) -> list:
    """Fetch weekly commit activity for a repo. Returns list of weekly counts."""
    url = f"{GITHUB_API}/repos/{owner_login}/{repo_name}/stats/commit_activity"
    try:
        response = requests.get(url, headers=_auth_headers(access_token), timeout=15)
        if response.status_code == 200:
            return response.json() or []
    except requests.RequestException:
        pass
    return []


def fetch_github_user(access_token: str) -> dict:
    response = requests.get(
        f"{GITHUB_API}/user",
        headers=_auth_headers(access_token),
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def exchange_code_for_token(code: str) -> tuple[str, str]:
    response = requests.post(
        GITHUB_TOKEN_URL,
        data={
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        },
        headers={"Accept": "application/json"},
        timeout=20,
    )
    if response.status_code != 200:
        raise RuntimeError("GitHub token exchange failed")
    payload = response.json()
    if not payload.get("access_token"):
        raise RuntimeError(payload.get("error_description", "GitHub token exchange failed"))
    return payload["access_token"], str(payload.get("scope", ""))


def create_oauth_state(db: Session, provider: str, role: str, user_id: Optional[int] = None) -> str:
    """Create a single-use OAuth state token bound to a provider and an intended role."""
    value = secrets.token_urlsafe(32)
    row = OAuthState(
        state=value,
        provider=provider,
        role=role,
        user_id=user_id,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=GITHUB_STATE_TTL_MINUTES),
    )
    db.add(row)
    db.commit()
    return value


def validate_oauth_state(db: Session, state: str) -> Optional[dict]:
    """Validate and consume a single-use OAuth state.

    Returns {"provider": str, "role": str|None, "user_id": int|None} on success, else None.
    """
    row = db.query(OAuthState).filter(OAuthState.state == state).first()
    if row is None:
        return None
    if row.expires_at < datetime.datetime.utcnow():
        db.delete(row)
        db.commit()
        return None
    result = {"provider": row.provider, "role": row.role, "user_id": row.user_id}
    db.delete(row)
    db.commit()
    return result


def upsert_github_account(db: Session, user_id: int, gh_user: dict, access_token: str, scopes: str) -> GitHubAccount:
    account = db.query(GitHubAccount).filter(GitHubAccount.user_id == user_id).first()
    if account is None:
        account = GitHubAccount(user_id=user_id)
        db.add(account)
    account.github_id = int(gh_user.get("id", 0))
    account.login = gh_user.get("login", "")
    account.name = gh_user.get("name")
    account.avatar_url = gh_user.get("avatar_url")
    account.bio = gh_user.get("bio")
    account.email = gh_user.get("email")
    account.html_url = gh_user.get("html_url")
    account.company = gh_user.get("company")
    account.location = gh_user.get("location")
    account.blog = gh_user.get("blog")
    account.followers = int(gh_user.get("followers", 0) or 0)
    account.following = int(gh_user.get("following", 0) or 0)
    account.public_repos = int(gh_user.get("public_repos", 0) or 0)
    account.account_created_at = _parse_iso(gh_user.get("created_at"))
    account.access_token_enc = encrypt_token(access_token)
    account.scope = scopes
    account.is_connected = True
    account.last_sync_error = None
    db.commit()
    db.refresh(account)
    return account


def sync_github_account(db: Session, account: GitHubAccount) -> GitHubAccount:
    start_time = time.time()
    sync_status = "success"
    sync_error = None
    rate_limit_info: dict = {}

    try:
        access_token = decrypt_token(account.access_token_enc)
        gh_user = fetch_github_user(access_token)
        account.login = gh_user.get("login", account.login)
        account.name = gh_user.get("name", account.name)
        account.avatar_url = gh_user.get("avatar_url", account.avatar_url)
        account.bio = gh_user.get("bio", account.bio)
        account.email = gh_user.get("email", account.email)
        account.html_url = gh_user.get("html_url", account.html_url)
        account.company = gh_user.get("company")
        account.location = gh_user.get("location")
        account.blog = gh_user.get("blog")
        account.followers = int(gh_user.get("followers", 0) or 0)
        account.following = int(gh_user.get("following", 0) or 0)
        account.public_repos = int(gh_user.get("public_repos", 0) or 0)
        account.account_created_at = _parse_iso(gh_user.get("created_at"))

        seen_ids = set()
        owned_repos = []
        current_page = 1
        lang_fetch_count = 0
        while True:
            response = requests.get(
                f"{GITHUB_API}/user/repos",
                params={
                    "per_page": GITHUB_REPOS_PAGE_SIZE,
                    "page": current_page,
                    "affiliation": "owner,collaborator,organization_member",
                    "sort": "updated",
                    "direction": "desc",
                },
                headers=_auth_headers(access_token),
                timeout=30,
            )
            if response.status_code != 200:
                response.raise_for_status()
            rate_limit_info = _get_rate_limit_info(response)
            repos = response.json()
            if not repos:
                break
            for repo in repos:
                repo_id = int(repo.get("id", 0))
                owner_login = (repo.get("owner") or {}).get("login") or account.login
                row = db.query(GitHubRepository).filter(
                    GitHubRepository.account_id == account.id,
                    GitHubRepository.github_repo_id == repo_id,
                ).first()
                if row is None:
                    row = GitHubRepository(account_id=account.id, github_repo_id=repo_id)
                    db.add(row)
                row.name = repo.get("name", "")
                row.full_name = repo.get("full_name", "")
                row.description = repo.get("description")
                row.html_url = repo.get("html_url")
                row.default_branch = repo.get("default_branch")
                row.visibility = repo.get("visibility")
                row.owner_login = owner_login
                row.primary_language = repo.get("language")
                row.size = int(repo.get("size", 0) or 0)
                row.open_issues_count = int(repo.get("open_issues_count", 0) or 0)
                lic = repo.get("license") or {}
                row.license_name = lic.get("spdx_id") or lic.get("name")
                row.archived = bool(repo.get("archived", False))
                row.topics_json = repo.get("topics", []) or []
                row.stargazers_count = int(repo.get("stargazers_count", 0) or 0)
                row.forks_count = int(repo.get("forks_count", 0) or 0)
                row.is_fork = bool(repo.get("fork", False))
                row.repo_created_at = _parse_iso(repo.get("created_at"))
                row.repo_updated_at = _parse_iso(repo.get("updated_at"))
                row.repo_pushed_at = _parse_iso(repo.get("pushed_at"))
                row.synced_at = datetime.datetime.utcnow()

                # Fetch language byte counts for a bounded number of non-fork repos
                # (repos arrive sorted by "updated", most recent first). This keeps
                # the per-sync API call count low while still representing the
                # developer's dominant languages from real byte statistics.
                if not row.is_fork and lang_fetch_count < LANGUAGE_FETCH_REPO_MAX:
                    lang_bytes = _get_repo_languages(access_token, owner_login, row.name)
                    if lang_bytes:
                        row.languages_json = lang_bytes
                        lang_fetch_count += 1

                if int((repo.get("owner") or {}).get("id", 0)) == account.github_id and not row.is_fork:
                    owned_repos.append(row)
                seen_ids.add(repo_id)
            db.commit()
            if len(repos) < GITHUB_REPOS_PAGE_SIZE:
                break
            current_page += 1

        if seen_ids:
            db.query(GitHubRepository).filter(
                GitHubRepository.account_id == account.id,
                ~GitHubRepository.github_repo_id.in_(list(seen_ids)),
            ).delete(synchronize_session=False)
            db.commit()

        owned_repos.sort(key=lambda r: r.repo_pushed_at or datetime.datetime.min, reverse=True)

        totals = _totals(access_token, account.login)
        additions = 0
        deletions = 0
        active_projects = 0
        per_repo_truncated = len(owned_repos) > PER_REPO_SEARCH_MAX
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=GITHUB_ACTIVE_REPO_DAYS)

        # Compute per-repo stats and aggregate languages
        all_repos_for_lang = list(db.query(GitHubRepository).filter(
            GitHubRepository.account_id == account.id,
        ).all())

        for index, repo_row in enumerate(owned_repos):
            contributions = _repo_stats(access_token, repo_row.owner_login or account.login, repo_row.name, account.github_id)
            stats = contributions.copy()
            if index < PER_REPO_SEARCH_MAX:
                stats.update(
                    _per_repo_search_stats(access_token, account.login, repo_row.owner_login or account.login, repo_row.name)
                )
            repo_row.statistics_json = stats
            if repo_row.repo_pushed_at and repo_row.repo_pushed_at >= cutoff:
                active_projects += 1
            if index < OWNED_REPO_STATS_MAX:
                additions += contributions.get("additions", 0)
                deletions += contributions.get("deletions", 0)
        db.commit()

        # Aggregate languages across all repos
        raw_langs = _aggregate_languages(all_repos_for_lang)
        account.languages_json = _languages_to_percentages(raw_langs)

        totals["active_projects"] = active_projects
        totals["additions"] = additions
        totals["deletions"] = deletions
        totals["per_repo_truncated"] = per_repo_truncated
        totals["contribution_score"] = compute_contribution_score(totals)
        totals["computed_at"] = datetime.datetime.utcnow().isoformat()
        totals["total_repos"] = len(all_repos_for_lang)

        account.statistics_json = totals
        account.last_sync_at = datetime.datetime.utcnow()
        account.last_sync_error = None
        db.commit()

        user = db.query(User).filter(User.id == account.user_id).first()
        if user is not None and user.github_url != account.html_url and account.html_url:
            user.github_url = account.html_url
            db.commit()
    except Exception as exc:
        sync_status = "failed"
        sync_error = str(exc)[:500]
        db.rollback()
        account = db.query(GitHubAccount).filter(GitHubAccount.id == account.id).first()
        if account is not None:
            account.last_sync_error = sync_error
            db.commit()

    # Log sync result
    duration_ms = int((time.time() - start_time) * 1000)
    try:
        log_entry = GitHubSyncLog(
            account_id=account.id,
            status=sync_status,
            error_message=sync_error,
            rate_limit_remaining=rate_limit_info.get("remaining"),
            rate_limit_reset_at=rate_limit_info.get("reset_at"),
            duration_ms=duration_ms,
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()

    return account


def fetch_recent_activity(db: Session, account: GitHubAccount) -> dict:
    access_token = decrypt_token(account.access_token_enc)
    response = requests.get(
        f"{GITHUB_API}/users/{account.login}/events",
        params={"per_page": 30},
        headers=_auth_headers(access_token),
        timeout=20,
    )
    if response.status_code != 200:
        return {"activity": [], "error": None}
    items = []
    for event in response.json():
        repo = event.get("repo") or {}
        payload = event.get("payload") or {}
        action = None
        if event.get("type") in ("IssuesEvent", "IssueCommentEvent", "PullRequestEvent", "PullRequestReviewEvent"):
            action = payload.get("action")
        items.append({
            "id": event.get("id"),
            "type": event.get("type"),
            "repo_name": repo.get("name"),
            "repo_url": f"https://github.com/{repo.get('name')}" if repo.get("name") else None,
            "action": action,
            "created_at": event.get("created_at"),
        })
    return {"activity": items, "error": None}


def fetch_language_summary(db: Session, account: GitHubAccount) -> dict:
    """Return aggregated language data stored on the account."""
    return {
        "languages": account.languages_json or [],
        "last_sync_at": account.last_sync_at.isoformat() if account.last_sync_at else None,
    }


def fetch_contributions_summary(db: Session, account: GitHubAccount) -> dict:
    """Build a dashboard-ready contribution summary from stored statistics."""
    totals = account.statistics_json or {}
    return {
        "contribution_score": int(totals.get("contribution_score", 0) or 0),
        "score_weights": SCORE_WEIGHTS,
        "active_projects": int(totals.get("active_projects", 0) or 0),
        "total_commits": int(totals.get("commits", 0) or 0),
        "total_prs": int(totals.get("prs_total", 0) or 0),
        "merged_prs": int(totals.get("prs_merged", 0) or 0),
        "open_prs": int(totals.get("prs_open", 0) or 0),
        "closed_prs": int(totals.get("prs_closed", 0) or 0),
        "issues_solved": int(totals.get("issues_closed", 0) or 0),
        "open_issues": int(totals.get("issues_open", 0) or 0),
        "code_reviews": int(totals.get("code_reviews", 0) or 0),
        "reviews_approved": int(totals.get("reviews_approved", 0) or 0),
        "reviews_changes_requested": int(totals.get("reviews_changes_requested", 0) or 0),
        "additions": int(totals.get("additions", 0) or 0),
        "deletions": int(totals.get("deletions", 0) or 0),
        "total_repos": int(totals.get("total_repos", 0) or 0),
        "last_sync_at": account.last_sync_at.isoformat() if account.last_sync_at else None,
    }
