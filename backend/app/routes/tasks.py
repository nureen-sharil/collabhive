from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import TaskResponse, TaskCreate, TaskUpdate, TaskCommentResponse, TaskCommentCreate
from app.models import User, Task, TaskComment, Workspace, StatusEnum, PriorityEnum
from app.security import get_current_user

router = APIRouter(prefix="/workspaces", tags=["tasks"])


@router.get("/{workspace_id}/tasks", response_model=List[TaskResponse])
def list_workspace_tasks(
    workspace_id: int,
    status: str = Query(None),
    priority: str = Query(None),
    my_tasks_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List tasks in a workspace with optional filters"""
    # Check workspace access
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
    
    # Base query
    query = db.query(Task).filter(Task.workspace_id == workspace_id)
    
    # Apply filters
    if status:
        query = query.filter(Task.status == status)
    
    if priority:
        query = query.filter(Task.priority == priority)
    
    if my_tasks_only:
        query = query.filter(Task.assignees.any(id=current_user.id))
    
    tasks = query.all()
    return tasks


@router.post("/{workspace_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    workspace_id: int,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new task in workspace"""
    # Check workspace access
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
    
    # Create task
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        status=task_data.status,
        due_date=task_data.due_date,
        progress=task_data.progress,
        workspace_id=workspace_id,
        creator_id=current_user.id
    )
    
    # Add assignees
    if task_data.assignee_ids:
        assignees = db.query(User).filter(User.id.in_(task_data.assignee_ids)).all()
        new_task.assignees.extend(assignees)
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task


@router.get("/{workspace_id}/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    workspace_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get task details"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.workspace_id == workspace_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check workspace access
    workspace = task.workspace
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return task


@router.put("/{workspace_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    workspace_id: int,
    task_id: int,
    update_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.workspace_id == workspace_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check workspace access
    workspace = task.workspace
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    assignee_ids = update_dict.pop("assignee_ids", None)
    
    for field, value in update_dict.items():
        setattr(task, field, value)
    
    # Update assignees if provided
    if assignee_ids is not None:
        task.assignees.clear()
        assignees = db.query(User).filter(User.id.in_(assignee_ids)).all()
        task.assignees.extend(assignees)
    
    db.commit()
    db.refresh(task)
    
    return task


@router.delete("/{workspace_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    workspace_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.workspace_id == workspace_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Only creator or workspace creator can delete
    workspace = task.workspace
    if task.creator_id != current_user.id and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can delete task"
        )
    
    db.delete(task)
    db.commit()


# Task Comments
@router.post("/{workspace_id}/tasks/{task_id}/comments", response_model=TaskCommentResponse, status_code=status.HTTP_201_CREATED)
def add_task_comment(
    workspace_id: int,
    task_id: int,
    comment_data: TaskCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add comment to task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.workspace_id == workspace_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check workspace access
    workspace = task.workspace
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    comment = TaskComment(
        text=comment_data.text,
        task_id=task_id,
        user_id=current_user.id
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return comment


@router.get("/{workspace_id}/tasks/{task_id}/comments", response_model=List[TaskCommentResponse])
def get_task_comments(
    workspace_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all comments for a task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.workspace_id == workspace_id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check workspace access
    workspace = task.workspace
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).all()
    return comments


@router.delete("/{workspace_id}/tasks/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_comment(
    workspace_id: int,
    task_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete task comment"""
    comment = db.query(TaskComment).filter(TaskComment.id == comment_id).first()
    
    if not comment or comment.task_id != task_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Only comment author or workspace creator can delete
    task = comment.task
    workspace = task.workspace
    if comment.user_id != current_user.id and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only comment author can delete"
        )
    
    db.delete(comment)
    db.commit()
