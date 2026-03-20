from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import logging

logger = logging.getLogger(__name__)

from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models.models import User, Message, Notification

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

CLOSE_CODES = {
    4001: ("NO_TOKEN", "No authentication token provided"),
    4002: ("INVALID_TOKEN", "Token is invalid or expired"),
    4003: ("INVALID_PAYLOAD", "Token payload is invalid"),
    4004: ("USER_NOT_FOUND", "User not found"),
    4005: ("USER_SUSPENDED", "User account is suspended"),
    4010: ("JSON_PARSE_ERROR", "Invalid JSON in message"),
    4011: ("UNKNOWN_ERROR", "An unknown error occurred"),
}

async def websocket_endpoint(websocket: WebSocket, token: Optional[str]):
    logger.info("WebSocket endpoint called")
    
    user_id: Optional[int] = None
    
    try:
        if not token:
            await websocket.send_json({
                "type": "error",
                "code": 4001,
                "error": "NO_TOKEN",
                "message": "No authentication token provided"
            })
            await websocket.close(code=4001)
            return

        payload = decode_token(token)
        if not payload:
            await websocket.send_json({
                "type": "error",
                "code": 4002,
                "error": "INVALID_TOKEN",
                "message": "Token is invalid or expired. Please login again."
            })
            await websocket.close(code=4002)
            return

        user_id = payload.get("sub")
        if not user_id:
            await websocket.send_json({
                "type": "error",
                "code": 4003,
                "error": "INVALID_PAYLOAD",
                "message": "Invalid token payload"
            })
            await websocket.close(code=4003)
            return

        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            await websocket.send_json({
                "type": "error",
                "code": 4003,
                "error": "INVALID_PAYLOAD",
                "message": "Invalid user ID in token"
            })
            await websocket.close(code=4003)
            return

        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(User).where(User.id == user_id_int))
                user = result.scalar_one_or_none()
        except Exception as db_error:
            logger.error(f"Database error: {db_error}")
            await websocket.send_json({
                "type": "error",
                "code": 5000,
                "error": "DATABASE_ERROR",
                "message": "Database connection error"
            })
            await websocket.close(code=1011)
            return

        if not user:
            await websocket.send_json({
                "type": "error",
                "code": 4004,
                "error": "USER_NOT_FOUND",
                "message": "User account not found"
            })
            await websocket.close(code=4004)
            return

        if user.is_suspended:
            await websocket.send_json({
                "type": "error",
                "code": 4005,
                "error": "USER_SUSPENDED",
                "message": "Your account has been suspended"
            })
            await websocket.close(code=4005)
            return

        await manager.connect(websocket, user_id_int)
        logger.info(f"User {user_id_int} ({user.name}) connected successfully")

        await websocket.send_json({
            "type": "connected",
            "code": 200,
            "user_id": user.id,
            "user_name": user.name,
            "message": "Connected to chat successfully"
        })

        while True:
            try:
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                logger.info(f"User {user_id_int} disconnected normally")
                break

            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "code": 4010,
                    "error": "JSON_PARSE_ERROR",
                    "message": "Invalid JSON format"
                })
                continue

            msg_type = message_data.get("type")

            if msg_type == "message":
                receiver_id = message_data.get("receiver_id")
                content = message_data.get("content")
                job_id = message_data.get("job_id")

                if not receiver_id or not content:
                    await websocket.send_json({
                        "type": "error",
                        "code": 4000,
                        "error": "MISSING_FIELDS",
                        "message": "Missing receiver_id or content"
                    })
                    continue

                try:
                    async with AsyncSessionLocal() as db:
                        message = Message(
                            sender_id=user_id_int,
                            receiver_id=int(receiver_id),
                            job_id=job_id,
                            content=content
                        )
                        db.add(message)
                        
                        notification = Notification(
                            user_id=int(receiver_id),
                            type="message",
                            title="New Message",
                            message=f"{user.name} sent you a message: {content[:50]}...",
                            related_id=None
                        )
                        db.add(notification)
                        
                        await db.commit()
                        await db.refresh(message)

                        message_dict = {
                            "type": "message",
                            "id": message.id,
                            "sender_id": user_id_int,
                            "sender_name": user.name,
                            "receiver_id": int(receiver_id),
                            "content": content,
                            "job_id": job_id,
                            "created_at": message.created_at.isoformat()
                        }

                        await manager.send_personal_message(message_dict, int(receiver_id))
                        await websocket.send_json(message_dict)
                except Exception as db_error:
                    logger.error(f"Database error while saving message: {db_error}")
                    await websocket.send_json({
                        "type": "error",
                        "code": 5001,
                        "error": "MESSAGE_SAVE_FAILED",
                        "message": "Failed to save message"
                    })

            elif msg_type == "read":
                sender_id = message_data.get("sender_id")
                if sender_id:
                    try:
                        async with AsyncSessionLocal() as db:
                            result = await db.execute(
                                select(Message).where(
                                    Message.sender_id == int(sender_id),
                                    Message.receiver_id == user_id_int,
                                    Message.is_read == False
                                )
                            )
                            messages = result.scalars().all()
                            for msg in messages:
                                msg.is_read = True
                            await db.commit()

                        await manager.send_personal_message({
                            "type": "read_receipt",
                            "sender_id": int(sender_id),
                            "reader_id": user_id_int
                        }, int(sender_id))
                    except Exception as db_error:
                        logger.error(f"Database error in read receipt: {db_error}")

            elif msg_type == "typing":
                receiver_id = message_data.get("receiver_id")
                if receiver_id:
                    await manager.send_personal_message({
                        "type": "typing",
                        "sender_id": user_id_int,
                        "sender_name": user.name
                    }, int(receiver_id))

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "code": 4011,
                "error": "UNKNOWN_ERROR",
                "message": "An unexpected error occurred"
            })
        except Exception:
            pass
    finally:
        if user_id:
            try:
                user_id_int_val = int(user_id)
                manager.disconnect(websocket, user_id_int_val)
            except (ValueError, TypeError):
                manager.disconnect(websocket, 0)
        else:
            manager.disconnect(websocket, 0)
