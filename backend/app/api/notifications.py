from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.core.database import SessionLocal, get_db
from app.core.security import decode_access_token, get_current_user
from app.models import models

router = APIRouter(tags=["Notifications & WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ConnectionManager()

def authenticate_websocket_user(token: Optional[str]) -> Optional[int]:
    """Decode the WS token and return the authenticated user id, or None if invalid/inactive."""
    if not token:
        return None
    user_id, _role = decode_access_token(token)
    if user_id is None:
        return None
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None or not user.is_active:
            return None
        return user_id
    finally:
        db.close()

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int, token: Optional[str] = None):
    authenticated_user_id = authenticate_websocket_user(token)
    if authenticated_user_id is None or authenticated_user_id != user_id:
        await websocket.close(code=4401, reason="Unauthorized: valid token for this user required")
        return
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "PONG", "payload": "Connection active"})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

@router.get("/api/notifications")
def get_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = user.id

    notes = db.query(models.NotificationItem).filter(models.NotificationItem.user_id == user_id).order_by(models.NotificationItem.created_at.desc()).all()
    return notes

@router.post("/api/notifications/mark-read")
def mark_notifications_read(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.NotificationItem).filter(models.NotificationItem.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"status": "success"}
