from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum

# Enums
class PriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class StatusEnum(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "inprogress"
    DONE = "done"

class NotificationTypeEnum(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ALERT = "alert"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    role: Optional[str] = None
    avatar_color: str = "#2563EB"

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    role: Optional[str] = None
    avatar_color: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


# Workspace Schemas
class WorkspaceBase(BaseModel):
    title: str
    description: Optional[str] = None
    color: str = "#2563EB"
    progress: float = 0.0
    status: str = "Not Started"
    deadline: Optional[datetime] = None

class WorkspaceCreate(WorkspaceBase):
    member_ids: Optional[List[int]] = []

class WorkspaceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    progress: Optional[float] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class WorkspaceResponse(WorkspaceBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    members: List[UserResponse] = []

    class Config:
        from_attributes = True


# Task Schemas
class TaskCommentBase(BaseModel):
    text: str

class TaskCommentCreate(TaskCommentBase):
    pass

class TaskCommentResponse(TaskCommentBase):
    id: int
    user_id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.MEDIUM
    status: StatusEnum = StatusEnum.TODO
    due_date: Optional[datetime] = None
    progress: float = 0.0

class TaskCreate(TaskBase):
    workspace_id: int
    assignee_ids: Optional[List[int]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[StatusEnum] = None
    due_date: Optional[datetime] = None
    progress: Optional[float] = None
    assignee_ids: Optional[List[int]] = None

class TaskResponse(TaskBase):
    id: int
    workspace_id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    assignees: List[UserResponse] = []
    comments: List[TaskCommentResponse] = []

    class Config:
        from_attributes = True


# Meeting Schemas
class MeetingTimeSlotBase(BaseModel):
    start_time: datetime
    end_time: datetime

class MeetingTimeSlotCreate(MeetingTimeSlotBase):
    pass

class MeetingTimeSlotResponse(MeetingTimeSlotBase):
    id: int
    meeting_id: int

    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: Optional[str] = None
    agenda: str
    voting_deadline: datetime

class MeetingCreate(MeetingBase):
    workspace_id: int
    time_slots: List[MeetingTimeSlotCreate]
    attendee_ids: Optional[List[int]] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    agenda: Optional[str] = None
    voting_deadline: Optional[datetime] = None
    selected_slot_id: Optional[int] = None

class MeetingResponse(MeetingBase):
    id: int
    workspace_id: int
    creator_id: int
    selected_slot_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    time_slots: List[MeetingTimeSlotResponse] = []
    attendees: List[UserResponse] = []

    class Config:
        from_attributes = True


# Chat Schemas
class MessageAttachmentBase(BaseModel):
    file_type: str
    filename: str
    file_size: int

class MessageAttachmentResponse(MessageAttachmentBase):
    id: int
    file_path: str

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    text: Optional[str] = None
    is_voice_message: bool = False
    voice_duration: Optional[int] = None

class ChatMessageCreate(ChatMessageBase):
    workspace_id: int

class ChatMessageUpdate(BaseModel):
    read: Optional[bool] = None

class ChatMessageResponse(ChatMessageBase):
    id: int
    workspace_id: int
    sender_id: int
    read: bool
    created_at: datetime
    sender: UserResponse
    attachments: List[MessageAttachmentResponse] = []

    class Config:
        from_attributes = True


# File Schemas
class FileBase(BaseModel):
    original_filename: str
    file_type: str
    file_size: int

class FileCreate(FileBase):
    workspace_id: int

class FileUpdate(BaseModel):
    original_filename: Optional[str] = None
    is_shared: Optional[bool] = None

class FileResponse(FileBase):
    id: int
    workspace_id: int
    owner_id: int
    stored_filename: str
    is_shared: bool
    share_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner: UserResponse

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationBase(BaseModel):
    type: NotificationTypeEnum
    title: str
    message: str

class NotificationCreate(NotificationBase):
    workspace_id: int
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    workspace_id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
