from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Table, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import enum

# Association tables for many-to-many relationships
workspace_members = Table(
    'workspace_members',
    Base.metadata,
    Column('workspace_id', Integer, ForeignKey('workspaces.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
)

task_assignees = Table(
    'task_assignees',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
)

meeting_attendees = Table(
    'meeting_attendees',
    Base.metadata,
    Column('meeting_id', Integer, ForeignKey('meetings.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
)

meeting_votes = Table(
    'meeting_votes',
    Base.metadata,
    Column('meeting_id', Integer, ForeignKey('meetings.id', ondelete='CASCADE'), primary_key=True),
    Column('time_slot_id', Integer, ForeignKey('meeting_time_slots.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
)


class PriorityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class StatusEnum(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "inprogress"
    DONE = "done"


class NotificationTypeEnum(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ALERT = "alert"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    location = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String(100), nullable=True)
    avatar_color = Column(String(7), default="#2563EB", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspaces = relationship("Workspace", secondary=workspace_members, back_populates="members")
    tasks = relationship("Task", secondary=task_assignees, back_populates="assignees")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.creator_id")
    messages = relationship("ChatMessage", back_populates="sender", cascade="all, delete-orphan")
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    created_workspaces = relationship("Workspace", back_populates="creator", foreign_keys="Workspace.creator_id")
    meetings = relationship("Meeting", secondary=meeting_attendees, back_populates="attendees")
    created_meetings = relationship("Meeting", back_populates="creator", foreign_keys="Meeting.creator_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), default="#2563EB", nullable=False)
    progress = Column(Float, default=0.0)
    status = Column(String(50), default="Not Started")
    deadline = Column(DateTime, nullable=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    members = relationship("User", secondary=workspace_members, back_populates="workspaces")
    creator = relationship("User", back_populates="created_workspaces", foreign_keys=[creator_id])
    tasks = relationship("Task", back_populates="workspace", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="workspace", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="workspace", cascade="all, delete-orphan")
    files = relationship("File", back_populates="workspace", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="workspace", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.MEDIUM)
    status = Column(Enum(StatusEnum), default=StatusEnum.TODO, index=True)
    due_date = Column(DateTime, nullable=True)
    progress = Column(Float, default=0.0)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    workspace_id = Column(Integer, ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    assignees = relationship("User", secondary=task_assignees, back_populates="tasks")
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[creator_id])
    workspace = relationship("Workspace", back_populates="tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    task_id = Column(Integer, ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    task = relationship("Task", back_populates="comments")
    user = relationship("User")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False, index=True)
    agenda = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)
    voting_deadline = Column(DateTime, nullable=False)
    selected_slot_id = Column(Integer, ForeignKey('meeting_time_slots.id'), nullable=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="meetings")
    time_slots = relationship("MeetingTimeSlot", back_populates="meeting", cascade="all, delete-orphan", foreign_keys="MeetingTimeSlot.meeting_id")
    attendees = relationship("User", secondary=meeting_attendees, back_populates="meetings")
    creator = relationship("User", back_populates="created_meetings", foreign_keys=[creator_id])
    selected_slot = relationship("MeetingTimeSlot", foreign_keys=[selected_slot_id])


class MeetingTimeSlot(Base):
    __tablename__ = "meeting_time_slots"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey('meetings.id', ondelete='CASCADE'), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    meeting = relationship("Meeting", back_populates="time_slots", foreign_keys=[meeting_id])
    votes = relationship("User", secondary=meeting_votes)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    text = Column(Text, nullable=True)
    is_voice_message = Column(Boolean, default=False)
    voice_duration = Column(Integer, nullable=True)  # in seconds
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="chat_messages")
    sender = relationship("User", back_populates="messages")
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")


class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey('chat_messages.id', ondelete='CASCADE'), nullable=False)
    file_type = Column(String(50), nullable=False)  # image, file
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("ChatMessage", back_populates="attachments")


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, document, spreadsheet, presentation, image
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(512), nullable=False)
    is_shared = Column(Boolean, default=False)
    share_link = Column(String(255), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="files")
    owner = relationship("User", back_populates="files")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(Enum(NotificationTypeEnum), default=NotificationTypeEnum.INFO)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="notifications")
    user = relationship("User", back_populates="notifications")
