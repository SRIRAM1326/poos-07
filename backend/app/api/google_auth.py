from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import requests

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_optional_current_user
from app.models import models
from app.services.github_service import create_oauth_state, validate_oauth_state

router = APIRouter(prefix="/auth/google", tags=["Google OAuth Login (Colleges & Companies)"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# College Admins, IT Companies and Non-IT Companies sign in exclusively through Google OAuth.
GOOGLE_ROLES = {"COLLEGE_ADMIN", "IT_COMPANY", "NON_IT_COMPANY"}


def _ensure_role_profile(db: Session, user: models.User) -> None:
    if user.role == "COLLEGE_ADMIN":
        existing = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == user.id).first()
        if existing is None:
            db.add(models.CollegeProfile(user_id=user.id))
    elif user.role in ("IT_COMPANY", "NON_IT_COMPANY"):
        existing = db.query(models.CompanyProfile).filter(models.CompanyProfile.user_id == user.id).first()
        if existing is None:
            db.add(models.CompanyProfile(
                user_id=user.id,
                company_name=user.full_name,
                company_type="IT" if user.role == "IT_COMPANY" else "NON_IT",
            ))


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
def get_google_auth_url(
    role: Optional[str] = Query(None, description="Intended role for the OAuth login session."),
    current_user: models.User = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Generate a Google OAuth 2.0 authorization URL for College Admins and Companies.

    - With a `role` query parameter this is an anonymous login flow.
    - Without one, the current authenticated user links their Google account from the dashboard.
    """
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id or "demo" in client_id.lower() or "your_google_client_id" in client_id.lower():
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )

    role_value = (role or "").upper()
    if not role_value:
        if current_user is None:
            raise HTTPException(
                status_code=401,
                detail="Please select 'College Admin', 'IT Company' or 'Non-IT Company' to continue with Google.",
            )
        role_value = current_user.role
    if role_value not in GOOGLE_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Google OAuth only supports roles: {', '.join(sorted(GOOGLE_ROLES))}. GitHub OAuth is used for Students & Mentors.",
        )

    redirect_uri = settings.GOOGLE_REDIRECT_URI
    state = create_oauth_state(db, "google", role_value, user_id=current_user.id if current_user else None)
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,
    }
    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return {
        "auth_url": auth_url,
        "client_id": client_id,
        "provider": "Google OAuth (Colleges & Companies)",
        "role": role_value,
    }


@router.get("/callback")
def google_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    current_user: models.User = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Exchange a Google OAuth code for a verified identity and log in / create the PoOS account."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured on the server.")

    auth_state = validate_oauth_state(db, state)
    if auth_state is None or auth_state.get("provider") != "google":
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired Google OAuth state. Please try signing in again.",
        )
    state_role = auth_state.get("role") or "COLLEGE_ADMIN"

    token_resp = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if token_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Google token exchange failed")
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="Google token exchange missing access token")

    userinfo_resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch Google user profile")
    google_info = userinfo_resp.json()

    # The Google account ID is the primary external identity.
    google_id = str(google_info.get("id") or "").strip()
    if not google_id:
        raise HTTPException(status_code=502, detail="Google user response missing account id")

    google_email = (google_info.get("email") or "").strip().lower() or None
    google_name = (google_info.get("name") or "").strip() or (google_email or "").split("@")[0]
    google_picture = google_info.get("picture")

    if not google_name:
        raise HTTPException(status_code=502, detail="Google user response missing name")

    user = (
        db.query(models.User)
        .filter(models.User.oauth_provider == "google", models.User.oauth_provider_uid == google_id)
        .first()
    )

    # Adopt legacy (seed/previously created) accounts that match the Google email,
    # so existing users can sign in through Google without a duplicate account.
    if user is None and google_email:
        email_user = db.query(models.User).filter(models.User.email == google_email).first()
        if email_user is not None and email_user.oauth_provider in (None, "seed"):
            user = email_user

    if user is None and current_user is not None:
        user = db.query(models.User).filter(models.User.id == current_user.id).first()

    was_new_user = False
    if user is None:
        user = models.User(
            email=google_email,
            full_name=google_name,
            role=state_role if state_role in GOOGLE_ROLES else "COLLEGE_ADMIN",
            is_active=True,
            avatar_url=google_picture,
            oauth_provider="google",
            oauth_provider_uid=google_id,
            profile_completed=False,
        )
        db.add(user)
        db.flush()
        was_new_user = True
    else:
        if user.role not in GOOGLE_ROLES:
            raise HTTPException(
                status_code=403,
                detail="This Google account is linked to a role that cannot sign in with Google.",
            )

    user.oauth_provider = "google"
    user.oauth_provider_uid = google_id
    user.avatar_url = google_picture or user.avatar_url
    if google_email:
        email_owner = db.query(models.User).filter(models.User.email == google_email, models.User.id != user.id).first()
        if email_owner is None:
            user.email = google_email
    if not user.full_name:
        user.full_name = google_name
    _ensure_role_profile(db, user)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully signed you in with Google ({user.email or google_name}).",
        "access_token": create_access_token(subject=user.id, role=user.role),
        "user": _user_payload(user),
    }