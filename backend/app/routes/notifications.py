from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import NotificationResponse, NotificationCreate
from app.models import User, Notification, Workspace
from app.security import get_current_user

router = APIRouter(prefix="/workspaces", tags=["notifications"])


@router.get("/{workspace_id}/notifications", response_model=List[NotificationResponse])
def get_workspace_notifications(
    workspace_id: int,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for workspace"""
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
    
    query = db.query(Notification).filter(
        Notification.workspace_id == workspace_id,
        Notification.user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).all()
    return notifications


@router.post("/{workspace_id}/notifications", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    workspace_id: int,
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create notification"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Only workspace creator can create notifications
    if workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can create notifications"
        )
    
    notification = Notification(
        workspace_id=workspace_id,
        user_id=notification_data.user_id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


@router.put("/{workspace_id}/notifications/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    workspace_id: int,
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.workspace_id == workspace_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


@router.put("/{workspace_id}/notifications/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.workspace_id == workspace_id,
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}


@router.delete("/{workspace_id}/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    workspace_id: int,
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.workspace_id == workspace_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
