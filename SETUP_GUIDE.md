# CollabHive - Full Stack Application

CollabHive is a comprehensive collaborative workspace management platform with a React frontend and Python FastAPI backend.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Configuration](#database-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Features](#features)
- [Environment Variables](#environment-variables)

## 🏗️ Project Structure

```
CollabHive App Prototype/
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                # Configuration management
│   │   ├── database.py              # Database connection and setup
│   │   ├── models.py                # SQLAlchemy ORM models
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── security.py              # JWT authentication and password hashing
│   │   └── routes/
│   │       ├── auth.py              # Authentication endpoints
│   │       ├── users.py             # User management endpoints
│   │       ├── workspaces.py        # Workspace CRUD endpoints
│   │       ├── tasks.py             # Task management endpoints
│   │       ├── meetings.py          # Meeting scheduling endpoints
│   │       ├── chat.py              # Chat and messaging endpoints
│   │       ├── files.py             # File upload/management endpoints
│   │       └── notifications.py     # Notification endpoints
│   ├── main.py                      # FastAPI application entry point
│   ├── seed_db.py                   # Database seeding script
│   ├── requirements.txt             # Python dependencies
│   └── .env.example                 # Example environment variables
│
├── src/                              # React TypeScript frontend
│   ├── lib/
│   │   ├── apiClient.ts             # HTTP client for API communication
│   │   └── api.ts                   # API service layer
│   ├── app/
│   │   ├── components/              # React components
│   │   ├── context/                 # State management contexts
│   │   └── routes.tsx               # Route definitions
│   ├── main.tsx                     # Frontend entry point
│   └── vite.config.ts               # Vite configuration
│
├── package.json                      # Frontend dependencies
├── requirements.txt                  # Backend dependencies
├── vite.config.ts                   # Vite configuration
└── README.md                        # This file
```

## 📋 Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Python** 3.9+
- **MySQL** 5.7+ or **SQLite** (for development)
- **Git** (optional, for version control)

## 🚀 Backend Setup

### 1. Install Python Dependencies

Navigate to the backend directory and install required packages:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration (MySQL)
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/collab_hive

# OR for SQLite (development)
# DATABASE_URL=sqlite:///./collab_hive.db

# JWT Configuration
SECRET_KEY=your_super_secret_key_change_in_production_12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=./uploads

# Server Configuration
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### 3. Set Up Database

**For MySQL:**

Create a database and update the `.env` file:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE collab_hive;
USE collab_hive;
```

**For SQLite:**

SQLite will be automatically created when you run the application.

### 4. Seed Database with Sample Data

```bash
python seed_db.py
```

This will create:
- 5 sample users
- 3 sample workspaces
- 6 sample tasks
- 1 sample meeting poll with time slots
- 3 sample chat messages
- 2 sample files
- 2 sample notifications

## 🖥️ Frontend Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Update Package.json Scripts

The `package.json` should include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## ▶️ Running the Application

### Terminal 1: Start Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or using the main.py directly:

```bash
python main.py
```

Backend will be available at: `http://localhost:8000`
API Documentation at: `http://localhost:8000/api/docs`

### Terminal 2: Start Frontend Development Server

```bash
npm run dev
# or
pnpm dev
```

Frontend will be available at: `http://localhost:5173`

## 🗄️ Database Configuration

### Database Schema Overview

The application uses the following main tables:

- **users**: User accounts with authentication
- **workspaces**: Collaborative workspaces/projects
- **workspace_members**: Many-to-many relationship between users and workspaces
- **tasks**: Task items with assignments and status tracking
- **task_assignees**: Many-to-many relationship for task assignments
- **task_comments**: Comments on tasks
- **meetings**: Meeting polls with voting
- **meeting_time_slots**: Available time slots for meetings
- **meeting_votes**: Voting records for time slots
- **chat_messages**: Workspace chat messages
- **message_attachments**: File attachments in messages
- **files**: Workspace file storage
- **notifications**: User notifications

### ERD (Entity Relationship Diagram)

```
users
  ├─ workspaces (creator_id)
  ├─ workspace_members (many-to-many)
  ├─ tasks (creator_id)
  ├─ task_assignees (many-to-many)
  ├─ chat_messages (sender_id)
  ├─ files (owner_id)
  ├─ meetings (creator_id)
  └─ notifications (user_id)

workspaces
  ├─ members (many-to-many)
  ├─ tasks
  ├─ meetings
  ├─ chat_messages
  ├─ files
  └─ notifications

tasks
  ├─ assignees (many-to-many)
  ├─ creator
  ├─ comments
  └─ workspace

meetings
  ├─ time_slots
  ├─ attendees (many-to-many)
  ├─ votes (many-to-many through meeting_votes)
  └─ workspace
```

## 📚 API Documentation

### Authentication Endpoints

**Register User**
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "password": "SecurePassword123"
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  ...
}
```

**Login**
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response: 200 OK
{
  "access_token": "eyJ0eXAiOiJKV1QiLC...",
  "token_type": "bearer",
  "user": { ... }
}
```

**Get Current User**
```
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  ...
}
```

### Workspace Endpoints

**List Workspaces**
```
GET /workspaces
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": 1,
    "title": "Project Name",
    "description": "...",
    "progress": 65,
    "status": "In Progress",
    ...
  }
]
```

**Create Workspace**
```
POST /workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Workspace",
  "description": "Description",
  "color": "#2563EB",
  "deadline": "2026-07-01T00:00:00",
  "member_ids": [2, 3]
}

Response: 201 Created
```

**Get Workspace**
```
GET /workspaces/{workspace_id}
Authorization: Bearer <token>

Response: 200 OK
```

**Update Workspace**
```
PUT /workspaces/{workspace_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "progress": 75
}

Response: 200 OK
```

**Delete Workspace**
```
DELETE /workspaces/{workspace_id}
Authorization: Bearer <token>

Response: 204 No Content
```

### Task Endpoints

**List Tasks**
```
GET /workspaces/{workspace_id}/tasks?status=todo&priority=high&my_tasks_only=false
Authorization: Bearer <token>

Response: 200 OK
[...]
```

**Create Task**
```
POST /workspaces/{workspace_id}/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Task Title",
  "description": "...",
  "priority": "high",
  "status": "todo",
  "due_date": "2026-07-15T10:00:00",
  "assignee_ids": [1, 2]
}

Response: 201 Created
```

### Meeting Endpoints

**List Meetings**
```
GET /workspaces/{workspace_id}/meetings
Authorization: Bearer <token>

Response: 200 OK
[...]
```

**Create Meeting Poll**
```
POST /workspaces/{workspace_id}/meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Project Planning",
  "agenda": "Discuss timeline and deliverables",
  "voting_deadline": "2026-07-01T18:00:00",
  "time_slots": [
    {
      "start_time": "2026-07-03T10:00:00",
      "end_time": "2026-07-03T11:00:00"
    },
    {
      "start_time": "2026-07-03T14:00:00",
      "end_time": "2026-07-03T15:00:00"
    }
  ],
  "attendee_ids": [1, 2, 3]
}

Response: 201 Created
```

**Vote for Time Slot**
```
POST /workspaces/{workspace_id}/meetings/{meeting_id}/vote/{slot_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Vote recorded"
}
```

### Chat Endpoints

**Get Messages**
```
GET /workspaces/{workspace_id}/messages?limit=50&offset=0
Authorization: Bearer <token>

Response: 200 OK
[...]
```

**Send Message**
```
POST /workspaces/{workspace_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Message text"
}

Response: 201 Created
```

**Upload Attachment**
```
POST /workspaces/{workspace_id}/messages/{message_id}/attachments
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file>

Response: 201 Created
```

### File Endpoints

**List Files**
```
GET /workspaces/{workspace_id}/files
Authorization: Bearer <token>

Response: 200 OK
[...]
```

**Upload File**
```
POST /workspaces/{workspace_id}/files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file>

Response: 201 Created
```

**Download File**
```
GET /workspaces/{workspace_id}/files/{file_id}/download
Authorization: Bearer <token>

Response: 200 OK (file binary)
```

**Share File**
```
POST /workspaces/{workspace_id}/files/{file_id}/share
Authorization: Bearer <token>

Response: 200 OK
{
  "share_link": "abc123def456...",
  "is_shared": true
}
```

### Notification Endpoints

**Get Notifications**
```
GET /workspaces/{workspace_id}/notifications?unread_only=false
Authorization: Bearer <token>

Response: 200 OK
[...]
```

**Mark as Read**
```
PUT /workspaces/{workspace_id}/notifications/{notification_id}/read
Authorization: Bearer <token>

Response: 200 OK
```

## 🏛️ Architecture

### Frontend Architecture

- **React 18** with TypeScript
- **Component-based UI** with shadcn/ui components
- **Custom state management** using React hooks and contexts
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling

### Backend Architecture

- **FastAPI** for high-performance REST API
- **SQLAlchemy ORM** for database operations
- **JWT Authentication** for secure API access
- **Pydantic** for request/response validation
- **MySQL/SQLite** for persistent data storage
- **CORS middleware** for cross-origin requests

## ✨ Features

### User Management
- User registration and login with JWT authentication
- User profile management (name, email, role, location, bio)
- Password change functionality
- User account soft-delete

### Workspace Management
- Create and manage collaborative workspaces
- Add/remove workspace members
- Track workspace progress
- Set deadlines and status

### Task Management
- Create, update, and delete tasks
- Assign tasks to team members
- Track task progress and priority
- Filter by status, priority, or assignee
- Add comments to tasks
- Due date tracking

### Meeting Scheduling
- Create meeting polls with multiple time slot options
- Team members vote for preferred times
- View voting statistics
- Select final meeting time

### Team Communication
- Real-time chat messaging within workspaces
- Message attachments (images and files)
- Voice message support
- Message read status
- View team member online status

### File Management
- Upload and store project files
- Organize files by workspace
- Generate shareable links
- File download and deletion
- Support for various file types

### Notifications
- Workspace-specific notifications
- Notification read status
- Bulk mark as read
- Notification types: info, success, warning, alert

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin requests
- **Access Control**: Role-based and ownership-based access
- **File Upload Validation**: File type and size validation
- **SQL Injection Prevention**: Parameterized queries via SQLAlchemy

## 📝 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/collab_hive
# DATABASE_URL=sqlite:///./collab_hive.db

# JWT
SECRET_KEY=your_secret_key_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# Server
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend Deployment (Production)

1. Update `.env` with production settings:
   - Set `DEBUG=False`
   - Use strong `SECRET_KEY`
   - Configure production database
   - Update `CORS_ORIGINS` with frontend URL

2. Install production dependencies:
   ```bash
   pip install gunicorn
   ```

3. Run with Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:8000 main:app
   ```

### Frontend Deployment (Production)

1. Build for production:
   ```bash
   npm run build
   ```

2. Deploy `dist` folder to:
   - Netlify
   - Vercel
   - GitHub Pages
   - Or your own server

## 🛠️ Development Tools

- **API Testing**: Use Swagger UI at `http://localhost:8000/api/docs`
- **Database Management**: MySQL Workbench or SQLiteStudio
- **Frontend Debugging**: React Developer Tools browser extension
- **API Debugging**: Postman or VS Code REST Client

## 📦 Dependencies

### Backend
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- python-jose 3.3.0
- passlib 1.7.4
- python-multipart 0.0.6
- PyMySQL 1.1.0

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- date-fns
- motion

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For issues or questions:
1. Check the API documentation at `/api/docs`
2. Review error messages in browser console (frontend) or server logs (backend)
3. Ensure database is properly configured
4. Verify all environment variables are set correctly

## 🎯 Next Steps

1. Install dependencies: `npm install` and `pip install -r requirements.txt`
2. Set up environment variables in `.env` files
3. Configure and start MySQL database
4. Run seed script: `python seed_db.py`
5. Start backend: `python main.py`
6. Start frontend: `npm run dev`
7. Open browser to `http://localhost:5173`
8. Login with demo credentials from seed data

## Demo Credentials

After running `seed_db.py`, you can login with:

```
Email: seroja.jane@collabhive.io
Password: password123
```

Or any other seeded user:
- john.doe@collabhive.io
- sara.miller@collabhive.io
- alex.brown@collabhive.io
- natasha.k@collabhive.io
