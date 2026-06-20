from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
import os

# Load .env file if present (install python-dotenv or set DATABASE_URL in your environment)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed — DATABASE_URL must be set in the environment instead

# Database setup
# Priority: environment variable > .env file > localhost fallback
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3307/collab_hive")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS so your React frontend (e.g., localhost:5173) can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Model ──────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)


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

# Create the table in the database if it doesn't exist yet
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

# ─── Dependency ──────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.post("/api/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if a user with this email already exists
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Hash the password and insert the new user record into the database
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), salt).decode('utf-8')
    new_user = User(name=request.name, email=request.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    # Verify that the user exists and the password matches the stored hash
    if not user or not bcrypt.checkpw(request.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Return the user's name and email so the frontend can populate the Dashboard
    return {"id": user.id, "name": user.name, "email": user.email}


@app.get("/api/users/by-email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=user.id, name=user.name, email=user.email)


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
def send_workspace_message(
    workspace_id: str,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
):
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