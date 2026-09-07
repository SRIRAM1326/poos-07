from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.schemas import schemas
from typing import List

router = APIRouter(prefix="/recognition", tags=["Recognition & Leaderboards"])


@router.get("/leaderboards/students")
def get_student_leaderboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id).order_by(models.StudentProfile.reputation_score.desc()).all()
    results = []
    for rank, (profile, user) in enumerate(students, start=1):
        results.append({
            "rank": rank,
            "user_id": user.id,
            "full_name": user.full_name,
            "college_name": profile.college_name,
            "department": profile.department,
            "reputation_score": profile.reputation_score,
            "avatar_url": user.avatar_url,
            "github_handle": profile.github_handle
        })
    return results

@router.get("/leaderboards/colleges")
def get_college_leaderboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    colleges = db.query(models.CollegeProfile).order_by(models.CollegeProfile.active_projects_count.desc()).all()
    results = []
    for rank, col in enumerate(colleges, start=1):
        results.append({
            "rank": rank,
            "college_name": col.college_name,
            "college_code": col.college_code,
            "location": col.location,
            "student_count": col.student_count,
            "active_projects": col.active_projects_count
        })
    return results

@router.get("/certificates", response_model=List[schemas.CertificateResponse])
def get_certificates(recipient_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Certificate).filter(models.Certificate.recipient_id == recipient_id).all()

@router.get("/events")
def get_events(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Event).all()
