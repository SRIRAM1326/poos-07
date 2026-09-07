from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, get_optional_current_user
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/auth", tags=["Auth"])

ALLOWED_ROLES = {"STUDENT", "COLLEGE_ADMIN", "MENTOR", "IT_COMPANY", "NON_IT_COMPANY"}


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


@router.get("/me")
def me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the authenticated user from the session token."""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "access_token": create_access_token(subject=user.id, role=user.role),
        "token_type": "bearer",
        "user": _user_payload(user),
    }


@router.post("/logout")
def logout(current_user: models.User = Depends(get_optional_current_user)):
    """Sign the user out. Clients clear their local session token."""
    return {"status": "success", "message": "Signed out successfully."}


@router.post("/complete-profile")
def complete_profile(data: schemas.ProfileSetupRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fill in or update the role-specific discoverability profile after OAuth sign-in."""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.linkedin_url: user.linkedin_url = data.linkedin_url
    if data.portfolio_url: user.portfolio_url = data.portfolio_url
    if data.github_url: user.github_url = data.github_url
    user.profile_completed = True

    if user.role == "STUDENT":
        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
        if sp:
            if data.linkedin_url: sp.linkedin_url = data.linkedin_url
            if data.portfolio_url: sp.portfolio_url = data.portfolio_url
            if data.github_url: sp.github_handle = data.github_url.split('/')[-1]
            if data.bio: sp.bio = data.bio
            if data.college_name: sp.college_name = data.college_name

    elif user.role == "MENTOR":
        mp = db.query(models.MentorProfile).filter(models.MentorProfile.user_id == user.id).first()
        if mp:
            if data.bio: mp.bio = data.bio
            if data.skills: mp.skills_json = list(data.skills)

    elif user.role in ["IT_COMPANY", "NON_IT_COMPANY"]:
        cp = db.query(models.CompanyProfile).filter(models.CompanyProfile.user_id == user.id).first()
        if cp:
            if data.website_url: cp.website_url = data.website_url; cp.website = data.website_url
            if data.linkedin_url: cp.linkedin_url = data.linkedin_url
            if data.company_name: cp.company_name = data.company_name
            if data.industry: cp.industry = data.industry
            if data.description: cp.description = data.description

    elif user.role == "COLLEGE_ADMIN":
        col = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == user.id).first()
        if col:
            if data.website_url: col.website = data.website_url
            if data.linkedin_url: col.linkedin_url = data.linkedin_url
            if data.college_name: col.college_name = data.college_name

    db.commit()
    db.refresh(user)
    return {
        "status": "success",
        "message": "PoOS Profile completed successfully!",
        "user": _user_payload(user),
    }