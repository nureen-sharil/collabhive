
# CollabHive - Collaborative Workspace Platform

A full-stack collaborative workspace management application built with React, TypeScript, FastAPI, and MySQL.

## 🎯 Overview

CollabHive is a comprehensive team collaboration platform that enables teams to:
- Manage projects and workspaces
- Create, assign, and track tasks
- Schedule meetings with team polling
- Communicate via real-time chat
- Share and manage files
- Receive workspace notifications

## ✨ Features

### Core Features
- **User Authentication**: Secure login/registration with JWT tokens
- **Workspace Management**: Create and manage collaborative workspaces
- **Task Management**: Create, assign, and track tasks with priorities and status
- **Meeting Scheduler**: Poll-based meeting scheduling with voting
- **Team Chat**: Real-time messaging with file attachments
- **File Management**: Upload, share, and manage workspace files
- **Notifications**: Real-time workspace notifications

### Technical Features
- Responsive design (mobile-first)
- Production-ready backend API
- Database-backed data persistence
- Secure JWT authentication
- File upload handling
- Error handling and validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MySQL 5.7+ (or SQLite for development)

### Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Configure Environment Variables**
   
   Frontend (`.env`):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

   Backend (`.env`):
   ```env
   DATABASE_URL=mysql+pymysql://root:password@localhost:3306/collab_hive
   SECRET_KEY=your_secret_key_here
   ```

4. **Initialize Database**
   ```bash
   cd backend
   python seed_db.py
   cd ..
   ```

5. **Start Backend (Terminal 1)**
   ```bash
   cd backend
   python main.py
   ```

6. **Start Frontend (Terminal 2)**
   ```bash
   npm run dev
   ```

7. **Open Browser**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/api/docs

## 📖 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup instructions
- [Database Schema](./DATABASE_SCHEMA.md) - Complete database documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [API Documentation](./backend/) - Backend API docs

## 📁 Project Structure

```
CollabHive App Prototype/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── models.py          # Database models
│   │   ├── schemas.py         # Request/response schemas
│   │   ├── routes/            # API endpoints
│   │   └── security.py        # Authentication
│   ├── main.py                # FastAPI application
│   ├── seed_db.py             # Database seeding
│   └── requirements.txt
├── src/                        # React TypeScript frontend
│   ├── app/
│   │   ├── components/        # React components
│   │   ├── context/           # State management
│   │   └── routes.tsx         # Routing
│   ├── lib/
│   │   ├── apiClient.ts       # HTTP client
│   │   └── api.ts             # API services
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

## 🔑 Demo Credentials

After running `seed_db.py`, login with:
- **Email**: seroja.jane@collabhive.io
- **Password**: password123

Or any other seeded user:
- john.doe@collabhive.io
- sara.miller@collabhive.io
- alex.brown@collabhive.io
- natasha.k@collabhive.io

All demo users have the same password: `password123`

## 🛠️ Development

### Available Scripts

Frontend:
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

Backend:
```bash
python main.py              # Start API server
python seed_db.py           # Seed database
python -m uvicorn main:app --reload  # With auto-reload
```

### API Documentation

After starting the backend, visit:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 🏗️ Architecture

### Frontend Stack
- React 18 with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- shadcn/ui components
- Custom HTTP client for API calls

### Backend Stack
- FastAPI for REST API
- SQLAlchemy for ORM
- JWT authentication
- Pydantic for validation
- MySQL database

## 🔐 Security

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure file upload handling
- SQL injection prevention via parameterized queries

## 📊 Database

The application uses a relational database with:
- User management and authentication
- Workspace and project management
- Task tracking and assignment
- Meeting scheduling with voting
- Chat messaging and file attachments
- Notification system

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema details.

## 🚀 Deployment

The application can be deployed to:
- Heroku
- AWS (EC2, RDS, S3, CloudFront)
- DigitalOcean
- Vercel (frontend)
- Netlify (frontend)
- Docker containers
- Traditional servers

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Workspaces
- `GET /workspaces` - List workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces/{id}` - Get workspace
- `PUT /workspaces/{id}` - Update workspace
- `DELETE /workspaces/{id}` - Delete workspace

### Tasks
- `GET /workspaces/{id}/tasks` - List tasks
- `POST /workspaces/{id}/tasks` - Create task
- `GET /workspaces/{id}/tasks/{id}` - Get task
- `PUT /workspaces/{id}/tasks/{id}` - Update task
- `DELETE /workspaces/{id}/tasks/{id}` - Delete task

### Meetings
- `GET /workspaces/{id}/meetings` - List meetings
- `POST /workspaces/{id}/meetings` - Create meeting
- `POST /workspaces/{id}/meetings/{id}/vote/{slot}` - Vote for slot

### Chat
- `GET /workspaces/{id}/messages` - Get messages
- `POST /workspaces/{id}/messages` - Send message
- `POST /workspaces/{id}/messages/{id}/attachments` - Upload attachment

### Files
- `GET /workspaces/{id}/files` - List files
- `POST /workspaces/{id}/files` - Upload file
- `GET /workspaces/{id}/files/{id}/download` - Download file
- `POST /workspaces/{id}/files/{id}/share` - Share file

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete API documentation.

## 🐛 Troubleshooting

### Backend won't start
1. Check if port 8000 is in use: `lsof -i :8000`
2. Verify database connection in `.env`
3. Ensure Python dependencies installed: `pip install -r requirements.txt`

### Frontend API errors
1. Verify backend is running
2. Check VITE_API_URL in `.env`
3. Verify browser console for specific errors
4. Check CORS configuration

### Database connection issues
1. Verify MySQL is running
2. Check credentials in DATABASE_URL
3. Ensure database is created
4. Run `python seed_db.py` to initialize schema

## 📝 Notes

- All passwords must be at least 8 characters
- File upload limited to 50MB per file
- JWT tokens expire after 30 minutes
- Database uses UTC timestamps
- Email addresses are case-insensitive

## 📞 Support

For issues or questions:
1. Check the [Setup Guide](./SETUP_GUIDE.md)
2. Review API documentation at `/api/docs`
3. Check application logs
4. Verify environment variables

## 📄 License

This project is part of the CollabHive application prototype.

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- API built with [FastAPI](https://fastapi.tiangolo.com)
- UI Components from [shadcn/ui](https://ui.shadcn.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
  