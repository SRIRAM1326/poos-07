from sqlalchemy.orm import Session
from typing import List
from app.repositories.event_repository import EventRepository
from app.models.models import Event

class EventService:
    def __init__(self, db: Session):
        self.repo = EventRepository(db)

    def get_ecosystem_events(self) -> List[Event]:
        """
        Returns all events across the ecosystem. 
        """
        return self.repo.get_all_events()

    def create_event(self, event_data: dict) -> Event:
        """
        Creates a new event in the ecosystem.
        """
        return self.repo.create_event(event_data)
