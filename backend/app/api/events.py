from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.event_service import EventService
from app.models import models
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/events", tags=["Ecosystem Events"])

class EventResponse(BaseModel):
    id: int
    title: str
    organizer_name: str
    event_type: str
    description: Optional[str]
    location: str
    event_date: str
    participant_count: int
    scope: str
    created_at: datetime

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    title: str
    organizer_name: str
    event_type: str = "HACKATHON"
    description: Optional[str] = None
    location: str = "Virtual / Hybrid"
    event_date: str
    scope: str = "Open to Entire PoOS"

@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    service = EventService(db)
    return service.get_ecosystem_events()

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ("COLLEGE_ADMIN", "MENTOR"):
        raise HTTPException(status_code=403, detail="Only college admins or mentors can create events")
    service = EventService(db)
    return service.create_event(event_in.model_dump())
