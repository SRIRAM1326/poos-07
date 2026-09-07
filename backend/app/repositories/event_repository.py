from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import Event

class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_events(self) -> List[Event]:
        return self.db.query(Event).all()

    def get_event_by_id(self, event_id: int) -> Optional[Event]:
        return self.db.query(Event).filter(Event.id == event_id).first()

    def create_event(self, event_data: dict) -> Event:
        db_event = Event(**event_data)
        self.db.add(db_event)
        self.db.commit()
        self.db.refresh(db_event)
        return db_event
