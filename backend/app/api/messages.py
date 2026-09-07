from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models

router = APIRouter(prefix="/messages", tags=["Direct Candidate Messaging"])

class MessageSendSchema(BaseModel):
    recipient_id: int
    sender_name: Optional[str] = None
    content: str

@router.post("/send", status_code=status.HTTP_201_CREATED)
def send_message(data: MessageSendSchema, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.recipient_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot send a message to yourself")
    msg = models.Message(
        sender_id=user.id,
        recipient_id=data.recipient_id,
        sender_name=data.sender_name or user.full_name,
        content=data.content
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.get("/thread/{other_user_id}")
def get_message_thread(other_user_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if other_user_id == user.id:
        raise HTTPException(status_code=400, detail="A message thread requires two distinct users")
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == user.id) & (models.Message.recipient_id == other_user_id)) |
        ((models.Message.sender_id == other_user_id) & (models.Message.recipient_id == user.id))
    ).order_by(models.Message.created_at.asc()).all()

    return messages
