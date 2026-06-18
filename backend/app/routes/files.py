from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import FileResponse as FileSchema
from app.models import User, File as FileModel, Workspace
from app.security import get_current_user, FileUtils
from app.config import get_settings
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/workspaces", tags=["files"])
settings = get_settings()


@router.get("/{workspace_id}/files", response_model=List[FileSchema])
def list_workspace_files(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files in workspace"""
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
    
    files = db.query(FileModel).filter(FileModel.workspace_id == workspace_id).all()
    return files


@router.post("/{workspace_id}/files", status_code=status.HTTP_201_CREATED)
def upload_file(
    workspace_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload file to workspace"""
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
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / "files" / str(workspace_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Read file content
    contents = file.file.read()
    file_size = len(contents)
    
    # Check file size
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
    file_type = determine_file_type(file.filename)
    
    # Create database record
    new_file = FileModel(
        workspace_id=workspace_id,
        owner_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_type=file_type,
        file_size=file_size,
        file_path=file_path
    )
    
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return {
        "id": new_file.id,
        "workspace_id": new_file.workspace_id,
        "owner_id": new_file.owner_id,
        "original_filename": new_file.original_filename,
        "stored_filename": new_file.stored_filename,
        "file_type": new_file.file_type,
        "file_size": new_file.file_size,
        "is_shared": new_file.is_shared,
        "share_link": new_file.share_link,
        "created_at": new_file.created_at,
        "updated_at": new_file.updated_at
    }


@router.get("/{workspace_id}/files/{file_id}", response_model=FileSchema)
def get_file_info(
    workspace_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information"""
    file = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.workspace_id == workspace_id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if current_user not in file.workspace.members and file.workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return file


@router.put("/{workspace_id}/files/{file_id}", response_model=FileSchema)
def update_file(
    workspace_id: int,
    file_id: int,
    update_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update file information"""
    file = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.workspace_id == workspace_id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if file.owner_id != current_user.id and file.workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can update file"
        )
    
    # Update allowed fields
    if "original_filename" in update_data:
        file.original_filename = update_data["original_filename"]
    
    if "is_shared" in update_data:
        file.is_shared = update_data["is_shared"]
        if update_data["is_shared"] and not file.share_link:
            file.share_link = FileUtils.generate_share_link()
    
    db.commit()
    db.refresh(file)
    
    return file


@router.delete("/{workspace_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    workspace_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete file"""
    file = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.workspace_id == workspace_id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if file.owner_id != current_user.id and file.workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can delete file"
        )
    
    # Delete physical file
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
    
    # Delete database record
    db.delete(file)
    db.commit()


@router.post("/{workspace_id}/files/{file_id}/share", response_model=dict)
def share_file(
    workspace_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate share link for file"""
    file = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.workspace_id == workspace_id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if file.owner_id != current_user.id and file.workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can share file"
        )
    
    if not file.share_link:
        file.share_link = FileUtils.generate_share_link()
        file.is_shared = True
        db.commit()
    
    return {
        "share_link": file.share_link,
        "is_shared": file.is_shared
    }


@router.get("/{workspace_id}/files/{file_id}/download")
def download_file(
    workspace_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download file"""
    file = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.workspace_id == workspace_id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if current_user not in file.workspace.members and file.workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not os.path.exists(file.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=file.file_path,
        filename=file.original_filename,
        media_type="application/octet-stream"
    )


def determine_file_type(filename: str) -> str:
    """Determine file type from extension"""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        return "image"
    elif ext in ['pdf']:
        return "pdf"
    elif ext in ['doc', 'docx']:
        return "document"
    elif ext in ['xls', 'xlsx']:
        return "spreadsheet"
    elif ext in ['ppt', 'pptx']:
        return "presentation"
    else:
        return "file"
