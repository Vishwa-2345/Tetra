from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from typing import List
import os
import uuid
import aiofiles

from app.core.database import get_db
from app.models.models import User, Message, Job, Notification
from app.schemas.schemas import MessageCreate, MessageResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/conversations", response_model=List[dict])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sent_query = select(Message.receiver_id).where(Message.sender_id == current_user.id)
    received_query = select(Message.sender_id).where(Message.receiver_id == current_user.id)
    
    sent_result = await db.execute(sent_query)
    received_result = await db.execute(received_query)
    
    sent_users = set(sent_result.scalars().all())
    received_users = set(received_result.scalars().all())
    all_users = sent_users.union(received_users)
    
    if not all_users:
        return []
    
    result = await db.execute(
        select(User).where(User.id.in_(list(all_users)))
    )
    users = result.scalars().all()
    
    conversations = []
    for user in users:
        last_msg = await db.execute(
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == current_user.id, Message.receiver_id == user.id),
                    and_(Message.sender_id == user.id, Message.receiver_id == current_user.id)
                )
            )
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_message = last_msg.scalar_one_or_none()
        
        unread_count = await db.execute(
            select(Message).where(
                Message.sender_id == user.id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            )
        )
        unread = len(unread_count.scalars().all())
        
        conversations.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_photo": user.profile_photo,
            "last_message": last_message.content if last_message else None,
            "last_message_time": last_message.created_at.isoformat() if last_message else None,
            "unread_count": unread
        })
    
    conversations.sort(key=lambda x: x["last_message_time"] or 0, reverse=True)
    return conversations

@router.get("/{user_id}", response_model=List[MessageResponse])
async def get_messages(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        )
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()
    
    unread = await db.execute(
        select(Message).where(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
    )
    for msg in unread.scalars().all():
        msg.is_read = True
    await db.commit()
    
    return [MessageResponse.model_validate(m) for m in reversed(messages)]

@router.post("", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == message_data.receiver_id))
    receiver = result.scalar_one_or_none()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        job_id=message_data.job_id,
        content=message_data.content,
        attachment_url=message_data.attachment_url,
        attachment_type=message_data.attachment_type
    )
    db.add(message)
    
    content_preview = message_data.content[:50] if message_data.content else "a file"
    notification = Notification(
        user_id=message_data.receiver_id,
        type="message",
        title="New Message",
        message=f"{current_user.name} sent you: {content_preview}...",
        related_id=None
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(message)
    
    return MessageResponse.model_validate(message)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    allowed_types = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    max_size = 10 * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    attachment_type = "image" if file.content_type.startswith("image/") else "document"
    
    file_url = f"/uploads/{unique_filename}"
    
    return {
        "url": file_url,
        "type": attachment_type,
        "filename": file.filename,
        "size": len(contents)
    }
