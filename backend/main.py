from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pathlib import Path
from app.config import get_settings
from app.database import Base, engine
from app.routes import auth, workspaces, tasks, meetings, chat, files, notifications, users

# Settings
settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="CollabHive API",
    description="Full-stack collaboration platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workspaces.router)
app.include_router(tasks.router)
app.include_router(meetings.router)
app.include_router(chat.router)
app.include_router(files.router)
app.include_router(notifications.router)

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "CollabHive API"}

# API Info
@app.get("/api", tags=["info"])
async def api_info():
    return {
        "service": "CollabHive API",
        "version": "1.0.0",
        "docs_url": "/api/docs",
        "redoc_url": "/api/redoc",
        "openapi_url": "/api/openapi.json"
    }

# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )

@app.get("/", tags=["root"])
async def root():
    return {
        "message": "CollabHive API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
