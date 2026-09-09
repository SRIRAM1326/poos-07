from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models

router = APIRouter(prefix="/mentor/sessions", tags=["Mentor Sessions"])

class SessionCreateSchema(BaseModel):
    mentor_id: int
    topic: str
    description: Optional[str] = None
    scheduled_at: str
    duration_minutes: int = 45

class StatusUpdateSchema(BaseModel):
    status: Optional[str] = None

@router.post("/book", status_code=status.HTTP_201_CREATED)
def book_session(data: SessionCreateSchema, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    student_user = db.query(models.User).filter(models.User.id == user.id).first()
    mentor_user = db.query(models.User).filter(models.User.id == data.mentor_id).first()

    if not mentor_user:
        raise HTTPException(status_code=404, detail="Mentor not found")
    student_name = student_user.full_name
    mentor_name = mentor_user.full_name

    new_session = models.MentorSession(
        student_id=user.id,
        mentor_id=data.mentor_id,
        student_name=student_name,
        mentor_name=mentor_name,
        topic=data.topic,
        description=data.description,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        status="PENDING"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("")
@router.get("/")
def get_sessions(role: str = "STUDENT", user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.MentorSession)
    if role == "MENTOR":
        query = query.filter(models.MentorSession.mentor_id == user.id)
    else:
        query = query.filter(models.MentorSession.student_id == user.id)
    return query.order_by(models.MentorSession.created_at.desc()).all()

@router.post("/{session_id}/status")
def update_session_status(
    session_id: int,
    data: Optional[StatusUpdateSchema] = None,
    status: Optional[str] = Query(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session_obj = db.query(models.MentorSession).filter(models.MentorSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_obj.mentor_id != user.id:
        raise HTTPException(status_code=403, detail="Only the session mentor can update this session")

    new_status = (data.status if data else None) or status
    if not new_status:
        raise HTTPException(status_code=400, detail="A status is required to update the session")
    session_obj.status = new_status
    db.commit()
    db.refresh(session_obj)
    return {"status": "success", "new_status": session_obj.status, "session": session_obj}
