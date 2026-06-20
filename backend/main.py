from datetime import datetime
import os
import bcrypt
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, inspect, text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:1234@localhost:3307/collab_hive")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Models ──────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)


class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    workspace_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    color = Column(String(7), nullable=False, default="#2563EB")
    progress = Column(Integer, nullable=False, default=0)
    
    # FIX: Added deadline field mapping straight to the database layer
    deadline = Column(String(50), nullable=True, default="")
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False, default="member")  # 'owner' or 'member'
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="members")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(String(100), index=True, nullable=False)
    sender_id = Column(Integer, index=True, nullable=False)
    receiver_id = Column(Integer, index=True, nullable=True)
    message_text = Column(Text, nullable=False, default="")
    attachment_type = Column(String(20), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    attachment_url = Column(Text, nullable=True)
    voice_duration = Column(String(20), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)


Base.metadata.create_all(bind=engine)

def ensure_chat_message_schema():
    inspector = inspect(engine)
    if "chat_messages" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("chat_messages")}
    ddl_statements: list[str] = []

    if "attachment_type" not in existing_columns:
        ddl_statements.append("ALTER TABLE chat_messages ADD COLUMN attachment_type VARCHAR(20) NULL")
    if "attachment_name" not in existing_columns:
        ddl_statements.append("ALTER TABLE chat_messages ADD COLUMN attachment_name VARCHAR(255) NULL")
    if "attachment_url" not in existing_columns:
        ddl_statements.append("ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT NULL")
    if "voice_duration" not in existing_columns:
        ddl_statements.append("ALTER TABLE chat_messages ADD COLUMN voice_duration VARCHAR(20) NULL")

    if not ddl_statements:
        return

    with engine.begin() as connection:
        for statement in ddl_statements:
            connection.execute(text(statement))

ensure_chat_message_schema()

# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

class WorkspaceCreate(BaseModel):
    workspace_name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    color: str = "#2563EB"
    owner_id: int
    
    # FIX: Expose validation rules for deadline inputs
    deadline: str | None = ""

class WorkspaceUpdate(BaseModel):
    workspace_name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    color: str | None = None
    progress: int | None = Field(None, ge=0, le=100)
    deadline: str | None = None

class WorkspaceMemberResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class WorkspaceResponse(BaseModel):
    id: int
    workspace_name: str
    description: str | None
    owner_id: int
    color: str
    progress: int
    
    # FIX: Ensure field matches payload extraction signatures
    deadline: str | None = ""
    
    created_at: datetime
    members: list[WorkspaceMemberResponse] = []

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    senderId: int
    receiverId: int | None = None
    messageText: str = ""
    attachmentType: str | None = None
    attachmentName: str | None = None
    attachmentUrl: str | None = None
    voiceDuration: str | None = None

class ChatMessageResponse(BaseModel):
    messageId: int
    senderId: int
    receiverId: int | None
    senderName: str
    messageText: str
    attachmentType: str | None = None
    attachmentName: str | None = None
    attachmentUrl: str | None = None
    voiceDuration: str | None = None
    timestamp: datetime

# ─── Dependencies & Security Guards ─────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_membership(workspace_id: int, user_id: int, db: Session):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id, 
        WorkspaceMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied: You are not a member of this workspace")
    return member

# ─── Authentication Endpoints ───────────────────────────────────────────────

@app.post("/api/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), salt).decode('utf-8')
    new_user = User(name=request.name, email=request.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not bcrypt.checkpw(request.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"id": user.id, "name": user.name, "email": user.email}

@app.get("/api/users/by-email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=user.id, name=user.name, email=user.email)

# ─── Workspaces Feature Endpoints ───────────────────────────────────────────

@app.post("/api/workspaces", response_model=WorkspaceResponse, status_code=201)
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_db)):
    if not payload.workspace_name.strip():
        raise HTTPException(status_code=400, detail="Workspace name cannot be empty")
    
    creator = db.query(User).filter(User.id == payload.owner_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Workspace owner user ID not found")

    duplicate = db.query(Workspace).filter(
        Workspace.workspace_name == payload.workspace_name.strip(),
        Workspace.owner_id == payload.owner_id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="You already own a workspace with this name")

    # FIX: Included 'deadline' mapping parameters inside instantiation parameters
    new_ws = Workspace(
        workspace_name=payload.workspace_name.strip(),
        description=payload.description,
        color=payload.color,
        owner_id=payload.owner_id,
        deadline=payload.deadline
    )
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)

    owner_membership = WorkspaceMember(
        workspace_id=new_ws.id,
        user_id=payload.owner_id,
        role="owner"
    )
    db.add(owner_membership)
    db.commit()
    
    m_user = db.query(User).filter(User.id == payload.owner_id).first()
    members_list = [WorkspaceMemberResponse(user_id=m_user.id, name=m_user.name, email=m_user.email, role="owner")]
    
    return WorkspaceResponse(
        id=new_ws.id, workspace_name=new_ws.workspace_name, description=new_ws.description,
        owner_id=new_ws.owner_id, color=new_ws.color, progress=new_ws.progress, 
        deadline=new_ws.deadline, created_at=new_ws.created_at, members=members_list
    )

@app.get("/api/users/{user_id}/workspaces", response_model=list[WorkspaceResponse])
def get_user_workspaces(user_id: int, db: Session = Depends(get_db)):
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_id).all()
    workspace_ids = [m.workspace_id for m in memberships]
    
    workspaces = db.query(Workspace).filter(Workspace.id.in_(workspace_ids)).all()
    
    results = []
    for ws in workspaces:
        m_list = []
        for mem in ws.members:
            m_user = db.query(User).filter(User.id == mem.user_id).first()
            if m_user:
                m_list.append(WorkspaceMemberResponse(
                    user_id=m_user.id, name=m_user.name, email=m_user.email, role=mem.role
                ))
        results.append(WorkspaceResponse(
            id=ws.id, workspace_name=ws.workspace_name, description=ws.description,
            owner_id=ws.owner_id, color=ws.color, progress=ws.progress, 
            deadline=ws.deadline, created_at=ws.created_at, members=m_list
        ))
    return results

@app.get("/api/workspaces/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace_by_id(workspace_id: int, current_user_id: int, db: Session = Depends(get_db)):
    verify_membership(workspace_id, current_user_id, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    m_list = []
    for m in ws.members:
        m_user = db.query(User).filter(User.id == m.user_id).first()
        if m_user:
            m_list.append(WorkspaceMemberResponse(user_id=m_user.id, name=m_user.name, email=m_user.email, role=m.role))
            
    return WorkspaceResponse(
        id=ws.id, workspace_name=ws.workspace_name, description=ws.description,
        owner_id=ws.owner_id, color=ws.color, progress=ws.progress, 
        deadline=ws.deadline, created_at=ws.created_at, members=m_list
    )

@app.put("/api/workspaces/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(workspace_id: int, current_user_id: int, payload: WorkspaceUpdate, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if ws.owner_id != current_user_id:
        raise HTTPException(status_code=403, detail="Only workspace owners can alter metadata settings")

    if payload.workspace_name is not None:
        ws.workspace_name = payload.workspace_name.strip()
    if payload.description is not None:
        ws.description = payload.description
    if payload.color is not None:
         ws.color = payload.color
    if payload.progress is not None:
         ws.progress = payload.progress
    if payload.deadline is not None:
         ws.deadline = payload.deadline

    db.commit()
    db.refresh(ws)
    
    m_list = []
    for m in ws.members:
        m_user = db.query(User).filter(User.id == m.user_id).first()
        if m_user:
            m_list.append(WorkspaceMemberResponse(user_id=m_user.id, name=m_user.name, email=m_user.email, role=m.role))
            
    return WorkspaceResponse(
        id=ws.id, workspace_name=ws.workspace_name, description=ws.description,
        owner_id=ws.owner_id, color=ws.color, progress=ws.progress, 
        deadline=ws.deadline, created_at=ws.created_at, members=m_list
    )

@app.delete("/api/workspaces/{workspace_id}", status_code=200)
def delete_workspace(workspace_id: int, current_user_id: int, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if ws.owner_id != current_user_id:
         raise HTTPException(status_code=403, detail="Only workspace owners can delete this workspace")
         
    db.delete(ws)
    db.commit()
    return {"message": "Workspace successfully removed"}

# ─── Chat Legacy Endpoints (Unchanged) ──────────────────────────────────────

def serialize_message(message: ChatMessage, sender_name: str) -> ChatMessageResponse:
    return ChatMessageResponse(
        messageId=message.id,
        senderId=message.sender_id,
        receiverId=message.receiver_id,
        senderName=sender_name,
        messageText=message.message_text,
        attachmentType=message.attachment_type,
        attachmentName=message.attachment_name,
        attachmentUrl=message.attachment_url,
        voiceDuration=message.voice_duration,
        timestamp=message.created_at,
    )

@app.get("/api/workspaces/{workspace_id}/messages", response_model=list[ChatMessageResponse])
def get_workspace_messages(workspace_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(ChatMessage, User)
        .join(User, ChatMessage.sender_id == User.id)
        .filter(ChatMessage.workspace_id == workspace_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .all()
    )
    return [serialize_message(message, sender.name) for message, sender in rows]

@app.post("/api/workspaces/{workspace_id}/messages", response_model=ChatMessageResponse)
def send_workspace_message(workspace_id: str, request: SendMessageRequest, db: Session = Depends(get_db)):
    message_text = request.messageText.strip()
    has_attachment = bool(request.attachmentType and request.attachmentName)
    has_voice = bool(request.voiceDuration)
    if not message_text and not has_attachment and not has_voice:
        raise HTTPException(status_code=400, detail="Message content is required")

    sender = db.query(User).filter(User.id == request.senderId).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    if request.receiverId is not None:
        receiver = db.query(User).filter(User.id == request.receiverId).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

    message = ChatMessage(
        workspace_id=workspace_id,
        sender_id=request.senderId,
        receiver_id=request.receiverId,
        message_text=message_text,
        attachment_type=request.attachmentType,
        attachment_name=request.attachmentName,
        attachment_url=request.attachmentUrl,
        voice_duration=request.voiceDuration,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return serialize_message(message, sender.name)