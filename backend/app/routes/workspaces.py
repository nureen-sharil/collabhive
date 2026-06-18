from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import WorkspaceResponse, WorkspaceCreate, WorkspaceUpdate, TaskResponse
from app.models import User, Workspace, Task, StatusEnum
from app.security import get_current_user

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all workspaces for current user"""
    workspaces = db.query(Workspace).filter(
        Workspace.members.any(id=current_user.id) |
        (Workspace.creator_id == current_user.id)
    ).all()
    return workspaces


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new workspace"""
    # Create workspace
    new_workspace = Workspace(
        title=workspace_data.title,
        description=workspace_data.description,
        color=workspace_data.color,
        progress=workspace_data.progress,
        status=workspace_data.status,
        deadline=workspace_data.deadline,
        creator_id=current_user.id
    )
    
    # Add current user as member
    new_workspace.members.append(current_user)
    
    # Add specified members
    if workspace_data.member_ids:
        members = db.query(User).filter(User.id.in_(workspace_data.member_ids)).all()
        new_workspace.members.extend(members)
    
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    return new_workspace


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workspace details"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check access
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return workspace


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: int,
    update_data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Only creator can update
    if workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can update workspace"
        )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(workspace, field, value)
    
    db.commit()
    db.refresh(workspace)
    
    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Only creator can delete
    if workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can delete workspace"
        )
    
    db.delete(workspace)
    db.commit()


@router.post("/{workspace_id}/members/{user_id}", status_code=status.HTTP_200_OK)
def add_member(
    workspace_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add member to workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    if workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can add members"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user not in workspace.members:
        workspace.members.append(user)
        db.commit()
    
    return {"message": "Member added successfully"}


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_200_OK)
def remove_member(
    workspace_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove member from workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    if workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can remove members"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user in workspace.members:
        workspace.members.remove(user)
        db.commit()
    
    return {"message": "Member removed successfully"}


@router.get("/{workspace_id}/overview", response_model=dict)
def get_workspace_overview(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workspace overview with statistics"""
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
    
    # Get task statistics
    tasks = db.query(Task).filter(Task.workspace_id == workspace_id).all()
    
    task_stats = {
        "total": len(tasks),
        "todo": len([t for t in tasks if t.status == StatusEnum.TODO]),
        "in_progress": len([t for t in tasks if t.status == StatusEnum.IN_PROGRESS]),
        "done": len([t for t in tasks if t.status == StatusEnum.DONE])
    }
    
    return {
        "workspace": workspace,
        "task_stats": task_stats,
        "member_count": len(workspace.members)
    }
