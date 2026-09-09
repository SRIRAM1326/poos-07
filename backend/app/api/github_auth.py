from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_optional_current_user
from app.models import models
from app.services.github_service import (
    GITHUB_AUTHORIZE_URL,
    GITHUB_SCOPES,
    create_oauth_state,
    validate_oauth_state,
    exchange_code_for_token,
    fetch_github_user,
    upsert_github_account,
    sync_github_account,
)

router = APIRouter(prefix="/auth/github", tags=["GitHub OAuth Login"])

# Students, Mentors and Professionals sign in exclusively through GitHub OAuth.
GITHUB_ROLES = {"STUDENT", "MENTOR"}


def _ensure_role_profile(db: Session, user: models.User) -> None:
    if user.role == "STUDENT":
        existing = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
        if existing is None:
            db.add(models.StudentProfile(
                user_id=user.id,
                github_handle=user.username,
            ))
    elif user.role == "MENTOR":
        existing = db.query(models.MentorProfile).filter(models.MentorProfile.user_id == user.id).first()
        if existing is None:
            db.add(models.MentorProfile(user_id=user.id))


def _user_payload(user: models.User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "linkedin_url": user.linkedin_url,
        "portfolio_url": user.portfolio_url,
        "github_url": user.github_url,
        "oauth_provider": user.oauth_provider,
        "profile_completed": user.profile_completed or False,
    }


@router.get("/url")
def get_github_auth_url(
    role: Optional[str] = Query(None, description="Intended role for the OAuth login session."),
    current_user: models.User = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Generate a GitHub OAuth 2.0 authorization URL for Students and Mentors/Professionals.

    - With a `role` query parameter this is an anonymous login flow (first-time sign-in).
    - Without one, the current authenticated user connects/linked their GitHub in their dashboard.
    """
    client_id = settings.GITHUB_CLIENT_ID
    if not client_id or "demo" in client_id.lower() or client_id == "your_github_client_id":
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
        )

    role_value = (role or "").upper()
    if not role_value:
        if current_user is None:
            raise HTTPException(
                status_code=401,
                detail="Please select 'Student' or 'Mentor / Professional' to continue with GitHub.",
            )
        role_value = current_user.role
    if role_value not in GITHUB_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"GitHub OAuth only supports roles: {', '.join(sorted(GITHUB_ROLES))}. Google OAuth is used for Colleges & Companies.",
        )

    redirect_uri = settings.GITHUB_REDIRECT_URI
    state = create_oauth_state(db, "github", role_value, user_id=current_user.id if current_user else None)
    url = (
        f"{GITHUB_AUTHORIZE_URL}?client_id={client_id}"
        f"&redirect_uri={redirect_uri}&scope={GITHUB_SCOPES}&state={state}"
    )
    return {"auth_url": url, "client_id": client_id, "mode": "live", "role": role_value}


@router.get("/callback")
def github_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    current_user: models.User = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Exchange a GitHub OAuth code for a validated identity and log in / create the PoOS account."""
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth is not configured on the server."
        )

    auth_state = validate_oauth_state(db, state)
    if auth_state is None or auth_state.get("provider") != "github":
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired GitHub OAuth state. Please try signing in again.",
        )
    state_role = auth_state.get("role") or "STUDENT"

    try:
        access_token, scopes = exchange_code_for_token(code)
        gh_user = fetch_github_user(access_token)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    github_id = str(gh_user.get("id") or "")
    github_username = gh_user.get("login", "")
    if not github_id or not github_username:
        raise HTTPException(status_code=502, detail="GitHub user response missing id or login field")

    # The GitHub account ID is the primary external identity.
    user = (
        db.query(models.User)
        .filter(models.User.oauth_provider == "github", models.User.oauth_provider_uid == github_id)
        .first()
    )
    if user is None:
        existing_account = db.query(models.GitHubAccount).filter(models.GitHubAccount.github_id == github_id).first()
        if existing_account is not None:
            user = db.query(models.User).filter(models.User.id == existing_account.user_id).first()

    if user is None and current_user is not None:
        user = db.query(models.User).filter(models.User.id == current_user.id).first()

    was_new_user = False
    if user is None:
        gh_email = (gh_user.get("email") or "").strip().lower() or None
        if gh_email:
            email_owner = db.query(models.User).filter(models.User.email == gh_email).first()
            if email_owner is not None:
                gh_email = None
        user = models.User(
            email=gh_email,
            username=github_username,
            full_name=gh_user.get("name") or github_username,
            role=state_role if state_role in GITHUB_ROLES else "STUDENT",
            is_active=True,
            avatar_url=gh_user.get("avatar_url"),
            github_url=gh_user.get("html_url"),
            oauth_provider="github",
            oauth_provider_uid=github_id,
            profile_completed=False,
        )
        db.add(user)
        db.flush()
        was_new_user = True
    else:
        if user.role not in GITHUB_ROLES:
            raise HTTPException(
                status_code=403,
                detail="This GitHub account is linked to a role that cannot sign in with GitHub.",
            )

    # Refresh profile data from the OAuth provider's canonical identity.
    user.oauth_provider = "github"
    user.oauth_provider_uid = github_id
    user.username = github_username
    user.avatar_url = gh_user.get("avatar_url") or user.avatar_url
    user.github_url = gh_user.get("html_url") or user.github_url
    gh_email = (gh_user.get("email") or "").strip().lower() or None
    if gh_email:
        email_owner = db.query(models.User).filter(models.User.email == gh_email, models.User.id != user.id).first()
        if email_owner is None:
            user.email = gh_email
    if not user.full_name:
        user.full_name = gh_user.get("name") or github_username
    _ensure_role_profile(db, user)
    db.commit()

    account = upsert_github_account(db, user.id, gh_user, access_token, scopes)

    student_profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
    if student_profile is not None and student_profile.github_handle != github_username:
        student_profile.github_handle = github_username
        db.commit()

    # Sync contribution statistics only for brand new connections to keep login fast.
    if was_new_user or account.statistics_json is None or account.last_sync_at is None:
        sync_github_account(db, account)
    db.refresh(account)
    db.refresh(user)

    return {
        "status": "success",
        "message": f"Successfully signed you in with GitHub @{github_username}.",
        "access_token": create_access_token(subject=user.id, role=user.role),
        "user": _user_payload(user),
    }