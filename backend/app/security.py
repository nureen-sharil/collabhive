from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models import User
import secrets
import string

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

class JWTTokens:
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            email: str = payload.get("sub")
            if email is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )


class PasswordUtils:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt (truncate to 72 bytes for bcrypt)"""
        pw_bytes = password.encode("utf-8")
        if len(pw_bytes) > 72:
            pw_bytes = pw_bytes[:72]
            password = pw_bytes.decode("utf-8", errors="ignore")
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)


class FileUtils:
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """Generate unique filename to avoid conflicts"""
        name, ext = original_filename.rsplit('.', 1) if '.' in original_filename else (original_filename, '')
        random_string = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(12))
        return f"{random_string}_{name}.{ext}" if ext else f"{random_string}_{name}"

    @staticmethod
    def generate_share_link() -> str:
        """Generate unique share link"""
        return secrets.token_urlsafe(32)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: __import__("app.database", fromlist=["get_db"]).get_db().__next__())
) -> User:
    """Get current authenticated user from token"""
    token = credentials.credentials
    payload = JWTTokens.verify_token(token)
    email: str = payload.get("sub")
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user
