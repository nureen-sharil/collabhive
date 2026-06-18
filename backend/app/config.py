from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/collab_hive"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # File Upload
    MAX_FILE_SIZE: int = 52428800  # 50MB
    UPLOAD_DIR: str = "./uploads"
    
    # Server
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()
