import hmac
import hashlib
import json
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models import models
from typing import Dict, Any, Optional

router = APIRouter(prefix="/webhooks", tags=["GitHub Webhooks Pipeline"])

def verify_github_signature(payload_body: bytes, signature_header: Optional[str]):
    if not settings.GITHUB_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="GitHub webhook secret not configured")
    if not signature_header:
        raise HTTPException(status_code=403, detail="Missing X-Hub-Signature-256 header")

    sha_name, signature = signature_header.split('=', 1)
    if sha_name != 'sha256':
        raise HTTPException(status_code=400, detail="Invalid signature algorithm")

    mac = hmac.new(settings.GITHUB_WEBHOOK_SECRET.encode(), msg=payload_body, digestmod=hashlib.sha256)
    if not hmac.compare_digest(mac.hexdigest(), signature):
        raise HTTPException(status_code=403, detail="Invalid GitHub webhook signature")

def process_webhook_payload_in_session(event_type: str, payload: Dict[str, Any]):
    """
    Runs the webhook processing in its own DB session so the caller can
    acknowledge the webhook immediately (async/decoupled from the request).
    Rolls back and logs when processing fails so errors are not silently dropped.
    """
    db = SessionLocal()
    try:
        result = process_webhook_payload(event_type, payload, db)
        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        print(f"webhook processing failed for event_type={event_type}: {exc}", flush=True)
        raise
    finally:
        db.close()

@router.post("/github", status_code=status.HTTP_202_ACCEPTED)
async def handle_github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: Optional[str] = Header(None),
    x_hub_signature_256: Optional[str] = Header(None)
):
    body = await request.body()
    verify_github_signature(body, x_hub_signature_256)

    try:
        payload = json.loads(body.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = x_github_event or payload.get("event_type", "push")
    background_tasks.add_task(process_webhook_payload_in_session, event_type, payload)
    return {
        "status": "accepted",
        "event_type": event_type,
        "detail": "Webhook acknowledged; processing asynchronously."
    }

@router.post("/github/test-payload", status_code=status.HTTP_202_ACCEPTED)
async def test_github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: Optional[str] = Header(None)
):
    body = await request.body()
    verify_github_signature(body, x_hub_signature_256)

    try:
        payload = json.loads(body.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("event_type", "pull_request")
    background_tasks.add_task(process_webhook_payload_in_session, event_type, payload)
    return {
        "status": "accepted",
        "event_type": event_type,
        "detail": "Webhook acknowledged; processing asynchronously."
    }

def _find_project_by_repo(db: Session, full_name: Optional[str]):
    if not full_name:
        return None
    target = full_name.strip().rstrip("/")
    projects = db.query(models.Project).filter(
        models.Project.repo_url.isnot(None),
        models.Project.repo_url != "",
    ).all()
    for project in projects:
        url = (project.repo_url or "").strip().split("?")[0].rstrip("/")
        if url == target or url.endswith(f"/{target}"):
            return project
    return None


def _find_contributor(db: Session, login: Optional[str]):
    if not login:
        return None, None, None
    account = db.query(models.GitHubAccount).filter(
        models.GitHubAccount.login == login,
        models.GitHubAccount.is_connected.is_(True),
    ).first()
    user_id = None
    if account is not None:
        user_id = account.user_id
    else:
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.github_handle == login).first()
        if profile is not None:
            user_id = profile.user_id
    if user_id is None:
        return None, None, None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if user is None or not user.is_active:
        return None, None, None
    return user_id, user.full_name, profile


def _skipped(reason: str, event_type: str):
    return {
        "status": "skipped",
        "event_type": event_type,
        "reason": reason,
        "processed_contributions": 0,
        "contributor": None,
        "reputation_points_gained": 0,
        "database": "No changes made"
    }


def process_webhook_payload(event_type: str, payload: Dict[str, Any], db: Session):
    processed_count = 0
    contributor_name = None

    if event_type == "pull_request" or "pull_request" in payload:
        pr = payload.get("pull_request", {}) or {}
        if pr.get("merged") is not True:
            return _skipped("pull request is not merged; no credit recorded", event_type)

        author_handle = (pr.get("user", {}) or {}).get("login") or (payload.get("sender", {}) or {}).get("login")
        user_id, contributor_name, profile = _find_contributor(db, author_handle)
        if user_id is None:
            return _skipped(f"No connected GitHub account or profile matches '{author_handle}'", event_type)

        repo_full_name = ((payload.get("repository", {}) or {}).get("full_name"))
        project = _find_project_by_repo(db, repo_full_name)
        if project is None:
            return _skipped(f"No project matches repository '{repo_full_name}'; not attributed", event_type)

        pr_number = pr.get("number")
        pr_title = pr.get("title")
        merge_sha = pr.get("merge_commit_sha") or (pr.get("head", {}) or {}).get("sha")
        if not pr_number or not pr_title or not merge_sha:
            return _skipped("PR payload missing number, title, or commit sha; nothing recorded", event_type)

        duplicate = db.query(models.Contribution).filter(
            models.Contribution.contributor_id == user_id,
            models.Contribution.project_id == project.id,
            models.Contribution.pr_number == pr_number,
        ).first()
        if duplicate:
            return _skipped(f"Duplicate merged-PR webhook for #{pr_number}; skipped", event_type)

        additions = pr.get("additions")
        deletions = pr.get("deletions")
        db.add(models.Contribution(
            project_id=project.id,
            contributor_id=user_id,
            contributor_name=contributor_name,
            commit_hash=merge_sha[:8],
            commit_message=f"PR #{pr_number}: {pr_title}",
            pr_number=pr_number,
            pr_title=pr_title,
            lines_added=additions if isinstance(additions, int) else None,
            lines_deleted=deletions if isinstance(deletions, int) else None,
            status="MERGED",
        ))
        processed_count = 1

    elif event_type == "push":
        commits = payload.get("commits", []) or []
        if not commits:
            return _skipped("push payload contains no commits; nothing recorded", event_type)

        repo_full_name = ((payload.get("repository", {}) or {}).get("full_name"))
        project = _find_project_by_repo(db, repo_full_name)
        if project is None:
            return _skipped(f"No project matches repository '{repo_full_name}'; not attributed", event_type)

        default_author = (payload.get("sender", {}) or {}).get("login") or (payload.get("pusher", {}) or {}).get("name")

        for commit in commits:
            commit_id = commit.get("id")
            commit_message = commit.get("message")
            if not commit_id or not commit_message:
                continue
            commit_author = (commit.get("author", {}) or {}).get("username") or default_author
            user_id, commit_contributor_name, profile = _find_contributor(db, commit_author)
            if user_id is None or profile is None:
                continue

            duplicate = db.query(models.Contribution).filter(
                models.Contribution.contributor_id == user_id,
                models.Contribution.project_id == project.id,
                models.Contribution.commit_hash == commit_id[:8],
            ).first()
            if duplicate:
                continue

            contributor_name = commit_contributor_name
            db.add(models.Contribution(
                project_id=project.id,
                contributor_id=user_id,
                contributor_name=commit_contributor_name,
                commit_hash=commit_id[:8],
                commit_message=commit_message,
                lines_added=None,
                lines_deleted=None,
                status="PENDING",
            ))
            processed_count += 1
    else:
        return _skipped(f"Unsupported webhook event type '{event_type}'", event_type)

    return {
        "status": "success",
        "event_type": event_type,
        "processed_contributions": processed_count,
        "contributor": contributor_name,
        "reputation_points_gained": 0,
        "database": "Contributions recorded"
    }
