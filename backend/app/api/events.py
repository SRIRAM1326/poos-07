from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.event_service import EventService
from app.models import models
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

router = APIRouter(prefix="/events", tags=["Ecosystem Events"])

# Canonical college event types.
EVENT_TYPES = [
    "Hackathons",
    "Workshops",
    "Technical seminars",
    "Competitions",
    "Conferences",
    "Project exhibitions",
    "Coding events",
    "Career events",
]

_LEGACY_TYPE_MAP = {
    "HACKATHON": "Hackathons",
    "SPRINT": "Coding events",
    "WORKSHOP": "Workshops",
    "MEETUP": "Conferences",
    "SEMINAR": "Technical seminars",
    "TECHNICAL SEMINAR": "Technical seminars",
    "COMPETITION": "Competitions",
    "CONFERENCE": "Conferences",
    "EXHIBITION": "Project exhibitions",
    "PROJECT EXHIBITION": "Project exhibitions",
    "CODING": "Coding events",
    "CAREER": "Career events",
}


def normalize_event_type(raw: Optional[str]) -> str:
    if not raw:
        return "Workshops"
    key = raw.strip()
    if key in EVENT_TYPES:
        return key
    mapped = _LEGACY_TYPE_MAP.get(key.upper())
    if mapped:
        return mapped
    return key.title()


def _parse_date(raw: Optional[str]):
    if not raw:
        return None
    try:
        return date.fromisoformat(raw.strip()[:10])
    except ValueError:
        return None


def derive_event_status(event) -> str:
    """UPCOMING / ACTIVE / COMPLETED charge from explicit override or date."""
    override = (getattr(event, "event_status", None) or "").upper()
    if override in ("UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"):
        return override
    day = _parse_date(getattr(event, "event_date", None))
    if day is None:
        return "UPCOMING"
    today = date.today()
    if day > today:
        return "UPCOMING"
    if day < today:
        return "COMPLETED"
    return "ACTIVE"


def registration_status_of(event, registered_count: int) -> str:
    """OPEN when POOS users can still register; otherwise CLOSED / FULL / COMPLETED."""
    derived = derive_event_status(event)
    if derived in ("COMPLETED", "CANCELLED"):
        return derived
    deadline = _parse_date(getattr(event, "registration_deadline", None))
    if deadline is not None and deadline < date.today():
        return "CLOSED"
    max_seats = getattr(event, "max_seats", 0) or 0
    if max_seats > 0 and registered_count >= max_seats:
        return "FULL"
    return "OPEN"


class EventResponse(BaseModel):
    id: int
    title: str
    organizer_name: str
    event_type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    event_date: Optional[str] = None
    participant_count: Optional[int] = 0
    scope: Optional[str] = None
    event_time: Optional[str] = None
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_seats: Optional[int] = 0
    is_online: Optional[bool] = False
    meeting_url: Optional[str] = None
    college_name: Optional[str] = None
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
    event_time: Optional[str] = None
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_seats: Optional[int] = 0
    is_online: Optional[bool] = False
    meeting_url: Optional[str] = None
    college_name: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_online: Optional[bool] = None
    meeting_url: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_seats: Optional[int] = None
    event_status: Optional[str] = None
    scope: Optional[str] = None

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
    data = event_in.model_dump()
    if current_user.role == "COLLEGE_ADMIN":
        # College Admins create events only under their own college identity.
        profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == current_user.id).first()
        if profile and profile.college_name:
            data["college_name"] = profile.college_name
    service = EventService(db)
    event = service.create_event(data)
    event.organizer_id = current_user.id
    if not event.organizer_name:
        event.organizer_name = current_user.full_name
    db.commit()
    db.refresh(event)
    return event


@router.get("/college/overview")
def college_events_overview(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """College Admin view: event statistics + enriched college activities."""
    if current_user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can view the college events overview")

    events = db.query(models.Event).order_by(models.Event.id.desc()).all()
    reg_counts: dict[int, int] = {}
    regs_by_event: dict[int, list] = {}
    for r in db.query(models.EventRegistration).filter(models.EventRegistration.status == "REGISTERED").all():
        reg_counts[r.event_id] = reg_counts.get(r.event_id, 0) + 1
        regs_by_event.setdefault(r.event_id, []).append(r)

    college_profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == current_user.id).first()
    my_college_key = ((college_profile.college_name if college_profile else "") or "").strip().lower()
    verified_colleges = {
        (c.college_name or "").strip().lower(): True
        for c in db.query(models.CollegeProfile).filter(models.CollegeProfile.is_verified == True).all()
        if (c.college_name or "").strip()
    }
    own_college_verified = bool(my_college_key and verified_colleges.get(my_college_key))

    def is_own(e) -> bool:
        if e.organizer_id == current_user.id:
            return True
        return bool(my_college_key and (e.college_name or "").strip().lower() == my_college_key)

    type_counts: dict[str, int] = {t: 0 for t in EVENT_TYPES}
    other_types: dict[str, int] = {}
    enriched = []
    upcoming = active = completed = 0
    total_participants = 0
    total_capacity = 0

    for e in events:
        derived = derive_event_status(e)
        if derived == "UPCOMING":
            upcoming += 1
        elif derived == "ACTIVE":
            active += 1
        elif derived == "COMPLETED":
            completed += 1
        participants = e.participant_count or 0
        total_participants += participants
        if (e.max_seats or 0) > 0:
            total_capacity += e.max_seats or 0

        canonical = normalize_event_type(e.event_type)
        if canonical in type_counts:
            type_counts[canonical] += 1
        else:
            other_types[canonical] = other_types.get(canonical, 0) + 1

        registered = reg_counts.get(e.id, 0)
        reg_status = registration_status_of(e, participants)
        mine = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == e.id,
            models.EventRegistration.user_id == current_user.id,
            models.EventRegistration.status == "REGISTERED").first() is not None
        enriched.append({
            "id": e.id,
            "title": e.title,
            "event_type": canonical,
            "event_type_raw": e.event_type,
            "description": e.description,
            "event_date": e.event_date,
            "event_time": e.event_time,
            "end_date": e.end_date,
            "location": e.location,
            "is_online": bool(e.is_online),
            "meeting_url": e.meeting_url,
            "organizer": e.organizer_name,
            "organizer_id": e.organizer_id,
            "college": e.college_name,
            "is_own": is_own(e),
            "college_verified": bool((e.college_name or "").strip().lower() in verified_colleges) if (e.college_name or "").strip() else own_college_verified,
            "registration_deadline": e.registration_deadline,
            "participants": participants,
            "registered_count": registered,
            "max_seats": e.max_seats or 0,
            "seats_left": max(0, (e.max_seats or 0) - participants) if (e.max_seats or 0) > 0 else None,
            "registration_status": reg_status,
            "event_status": derived,
            "scope": e.scope,
            "is_registered": mine,
            "recent_participants": [
                {"user_id": r.user_id, "user_name": r.user_name,
                 "registered_at": r.registered_at.isoformat() if r.registered_at else None}
                for r in sorted(regs_by_event.get(e.id, []), key=lambda r: r.registered_at or "", reverse=True)[:5]
            ],
        })

    total_registrations = sum(reg_counts.values())
    participation_rate = round((total_participants / total_capacity * 100), 1) if total_capacity > 0 else 0.0
    by_type = [{"event_type": t, "count": type_counts[t]} for t in EVENT_TYPES]
    for name, cnt in sorted(other_types.items(), key=lambda kv: kv[1], reverse=True):
        by_type.append({"event_type": name, "count": cnt})

    return {
        "summary": {
            "own_college_verified": own_college_verified,
            "total_events": len(events),
            "upcoming_events": upcoming,
            "active_events": active,
            "completed_events": completed,
            "total_registrations": total_registrations,
            "total_participants": total_participants,
            "participation_rate": participation_rate,
            "by_type": by_type,
        },
        "events": enriched,
    }


@router.post("/{event_id}/register")
def register_for_event(event_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """POOS users register to participate in a college event."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id,
        models.EventRegistration.user_id == current_user.id).first()
    if existing and existing.status == "REGISTERED":
        return {"status": "success", "message": "Already registered for this event."}
    participants = event.participant_count or 0
    if registration_status_of(event, participants) != "OPEN":
        raise HTTPException(status_code=400, detail="Registrations are closed for this event.")
    if existing:
        existing.status = "REGISTERED"
        existing.user_name = current_user.full_name
    else:
        db.add(models.EventRegistration(event_id=event_id, user_id=current_user.id,
                                        user_name=current_user.full_name, status="REGISTERED"))
    event.participant_count = participants + 1
    db.commit()
    return {"status": "success", "message": "Registered successfully."}


@router.delete("/{event_id}/register")
def cancel_registration(event_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id,
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.status == "REGISTERED").first()
    if not existing:
        raise HTTPException(status_code=404, detail="Registration not found.")
    existing.status = "CANCELLED"
    event.participant_count = max(0, (event.participant_count or 0) - 1)
    db.commit()
    return {"status": "success", "message": "Registration cancelled."}


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, patch: EventUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    # Organizers manage their own events; College Admins manage only their own
    # college's events — never another college's.
    if event.organizer_id == current_user.id:
        pass
    elif current_user.role == "COLLEGE_ADMIN":
        profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == current_user.id).first()
        admin_key = ((profile.college_name if profile else "") or "").strip().lower()
        event_key = ((event.college_name or "") or "").strip().lower()
        if not admin_key or not event_key or event_key != admin_key:
            raise HTTPException(status_code=403, detail="You can only manage your own college events.")
    else:
        raise HTTPException(status_code=403, detail="Only the organizer or college admin can update the event")
    data = patch.model_dump(exclude_unset=True)
    if "event_status" in data and data["event_status"]:
        data["event_status"] = data["event_status"].upper()
    for key, value in data.items():
        if hasattr(event, key):
            setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event
