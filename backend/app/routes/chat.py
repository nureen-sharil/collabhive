from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import ChatMessageResponse, ChatMessageCreate, ChatMessageUpdate
from app.models import User, ChatMessage, Workspace, MessageAttachment
from app.security import get_current_user, FileUtils
from app.config import get_settings
import os
from pathlib import Path

router = APIRouter(prefix="/workspaces", tags=["chat"])
settings = get_settings()


@router.get("/{workspace_id}/messages", response_model=List[ChatMessageResponse])
def get_workspace_messages(
    workspace_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat messages from workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.workspace_id == workspace_id
    ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()
    
    return list(reversed(messages))


@router.post("/{workspace_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    workspace_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send message to workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    message = ChatMessage(
        workspace_id=workspace_id,
        sender_id=current_user.id,
        text=message_data.text,
        is_voice_message=message_data.is_voice_message,
        voice_duration=message_data.voice_duration,
        read=False
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


@router.put("/{workspace_id}/messages/{message_id}", response_model=ChatMessageResponse)
def update_message(
    workspace_id: int,
    message_id: int,
    update_data: ChatMessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update message (mark as read)"""
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.workspace_id == workspace_id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(message, field, value)
    
    db.commit()
    db.refresh(message)
    
    return message


@router.delete("/{workspace_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    workspace_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete message"""
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.workspace_id == workspace_id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sender can delete message"
        )
    
    db.delete(message)
    db.commit()


@router.post("/{workspace_id}/messages/{message_id}/attachments", status_code=status.HTTP_201_CREATED)
def upload_message_attachment(
    workspace_id: int,
    message_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload attachment to message"""
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.workspace_id == workspace_id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sender can add attachments"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / "messages" / str(workspace_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Check file size
    file_size = 0
    contents = file.file.read()
    file_size = len(contents)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE} bytes"
        )
    
    # Generate unique filename
    stored_filename = FileUtils.generate_unique_filename(file.filename)
    file_path = str(upload_dir / stored_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Determine file type
    file_type = "image" if file.content_type.startswith("image") else "file"
    
    # Create attachment record
    attachment = MessageAttachment(
        message_id=message_id,
        file_type=file_type,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "file_type": attachment.file_type,
        "filename": attachment.filename,
        "file_size": attachment.file_size,
        "file_path": attachment.file_path
    }
