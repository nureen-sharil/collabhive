from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt

# Database setup
# Update with your actual MySQL username, password, and database name (e.g. collabhive)
# If your MySQL uses an empty password for root, leave it as root:@localhost
DATABASE_URL = "mysql+pymysql://root:@localhost:3307/collab_hive"

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

# Create the table in the database if it doesn't exist yet
Base.metadata.create_all(bind=engine)

# ─── Pydantic Schemas ────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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
    return {"name": user.name, "email": user.email}