import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.insert(0, os.path.dirname(__file__))

from app.config import get_settings
from app.database import Base
from app.models import User, Workspace, Task, Meeting, MeetingTimeSlot, ChatMessage, File, Notification
from app.security import PasswordUtils
from datetime import datetime, timedelta

settings = get_settings()

# Create engine and session
engine = create_engine(settings.DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)

def init_db():
    """Initialize database with seed data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_user = db.query(User).first()
        if existing_user:
            print("Database already seeded. Skipping...")
            return
        
        print("Creating seed data...")
        
        # Create users
        users_data = [
            {
                "email": "seroja.jane@collabhive.io",
                "name": "Seroja Jane",
                "password": "password123",
                "phone": "+1234567890",
                "location": "San Francisco, CA",
                "role": "Frontend Developer",
                "avatar_color": "#2563EB"
            },
            {
                "email": "john.doe@collabhive.io",
                "name": "John Doe",
                "password": "password123",
                "phone": "+1234567891",
                "location": "New York, NY",
                "role": "Backend Developer",
                "avatar_color": "#2563EB"
            },
            {
                "email": "sara.miller@collabhive.io",
                "name": "Sara Miller",
                "password": "password123",
                "phone": "+1234567892",
                "location": "Boston, MA",
                "role": "Project Manager",
                "avatar_color": "#7C3AED"
            },
            {
                "email": "alex.brown@collabhive.io",
                "name": "Alex Brown",
                "password": "password123",
                "phone": "+1234567893",
                "location": "Austin, TX",
                "role": "Designer",
                "avatar_color": "#DB2777"
            },
            {
                "email": "natasha.k@collabhive.io",
                "name": "Natasha K.",
                "password": "password123",
                "phone": "+1234567894",
                "location": "Seattle, WA",
                "role": "QA Engineer",
                "avatar_color": "#16A34A"
            }
        ]
        
        users = []
        for user_data in users_data:
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                password_hash=PasswordUtils.hash_password(user_data["password"]),
                phone=user_data["phone"],
                location=user_data["location"],
                role=user_data["role"],
                avatar_color=user_data["avatar_color"]
            )
            users.append(user)
            db.add(user)
        
        db.commit()
        print(f"Created {len(users)} users")
        
        # Create workspaces
        workspace1 = Workspace(
            title="Software Methodology Project",
            description="Software development methodology research and implementation",
            color="#2563EB",
            progress=65.0,
            status="In Progress",
            deadline=datetime.now() + timedelta(days=30),
            creator_id=users[0].id
        )
        workspace1.members.extend(users)
        
        workspace2 = Workspace(
            title="Software Testing",
            description="QA and testing framework development",
            color="#7C3AED",
            progress=30.0,
            status="In Progress",
            deadline=datetime.now() + timedelta(days=45),
            creator_id=users[4].id
        )
        workspace2.members.extend(users[:3])
        
        workspace3 = Workspace(
            title="UI/UX Case Study",
            description="User interface and experience design case study",
            color="#16A34A",
            progress=0.0,
            status="Not Started",
            deadline=datetime.now() + timedelta(days=60),
            creator_id=users[3].id
        )
        workspace3.members.extend(users)
        
        db.add(workspace1)
        db.add(workspace2)
        db.add(workspace3)
        db.commit()
        print("Created 3 workspaces")
        
        # Create tasks
        tasks_data = [
            {
                "title": "Design docs",
                "description": "Create comprehensive design documentation",
                "priority": "high",
                "status": "inprogress",
                "due_date": datetime.now() + timedelta(days=7),
                "progress": 50.0,
                "workspace_id": workspace1.id,
                "creator_id": users[0].id,
                "assignee_ids": [users[3].id, users[0].id]
            },
            {
                "title": "User research",
                "description": "Conduct user research and interviews",
                "priority": "high",
                "status": "inprogress",
                "due_date": datetime.now() + timedelta(days=5),
                "progress": 75.0,
                "workspace_id": workspace1.id,
                "creator_id": users[0].id,
                "assignee_ids": [users[3].id]
            },
            {
                "title": "Database schema",
                "description": "Design and implement database schema",
                "priority": "high",
                "status": "todo",
                "due_date": datetime.now() + timedelta(days=10),
                "progress": 0.0,
                "workspace_id": workspace1.id,
                "creator_id": users[1].id,
                "assignee_ids": [users[1].id]
            },
            {
                "title": "API testing",
                "description": "Comprehensive API testing suite",
                "priority": "medium",
                "status": "inprogress",
                "due_date": datetime.now() + timedelta(days=8),
                "progress": 40.0,
                "workspace_id": workspace2.id,
                "creator_id": users[4].id,
                "assignee_ids": [users[4].id]
            },
            {
                "title": "Landing page redesign",
                "description": "Redesign and implement landing page",
                "priority": "medium",
                "status": "done",
                "due_date": datetime.now() - timedelta(days=2),
                "progress": 100.0,
                "workspace_id": workspace1.id,
                "creator_id": users[0].id,
                "assignee_ids": [users[0].id, users[3].id]
            },
            {
                "title": "OAuth2 auth",
                "description": "Implement OAuth2 authentication",
                "priority": "high",
                "status": "todo",
                "due_date": datetime.now() + timedelta(days=15),
                "progress": 0.0,
                "workspace_id": workspace1.id,
                "creator_id": users[1].id,
                "assignee_ids": [users[1].id]
            }
        ]
        
        for task_data in tasks_data:
            assignee_ids = task_data.pop("assignee_ids")
            task = Task(**task_data)
            assignees = [u for u in users if u.id in assignee_ids]
            task.assignees.extend(assignees)
            db.add(task)
        
        db.commit()
        print(f"Created {len(tasks_data)} tasks")
        
        # Create meetings
        now = datetime.now()
        meeting1 = Meeting(
            workspace_id=workspace1.id,
            title="Project Planning",
            agenda="Discuss project timeline and deliverables",
            voting_deadline=now + timedelta(days=2),
            creator_id=users[0].id
        )
        
        # Add time slots
        slot1 = MeetingTimeSlot(
            start_time=now + timedelta(days=3, hours=10),
            end_time=now + timedelta(days=3, hours=11)
        )
        slot2 = MeetingTimeSlot(
            start_time=now + timedelta(days=3, hours=14),
            end_time=now + timedelta(days=3, hours=15)
        )
        slot3 = MeetingTimeSlot(
            start_time=now + timedelta(days=4, hours=9),
            end_time=now + timedelta(days=4, hours=10)
        )
        
        meeting1.time_slots.extend([slot1, slot2, slot3])
        meeting1.attendees.extend(users[:3])
        
        db.add(meeting1)
        db.commit()
        print("Created meeting poll")
        
        # Create chat messages
        msg1 = ChatMessage(
            workspace_id=workspace1.id,
            sender_id=users[0].id,
            text="Hey team! Let's sync up on the project status.",
            read=True
        )
        msg2 = ChatMessage(
            workspace_id=workspace1.id,
            sender_id=users[1].id,
            text="Sure! I've finished the backend API. Ready for testing.",
            read=True
        )
        msg3 = ChatMessage(
            workspace_id=workspace1.id,
            sender_id=users[0].id,
            text="Great! Let's schedule a meeting to review the implementation.",
            read=False
        )
        
        db.add_all([msg1, msg2, msg3])
        db.commit()
        print("Created chat messages")
        
        # Create files
        file1 = File(
            workspace_id=workspace1.id,
            owner_id=users[0].id,
            original_filename="Project_Requirements.pdf",
            stored_filename="abc123_Project_Requirements.pdf",
            file_type="pdf",
            file_size=2400000,
            file_path="./uploads/files/1/abc123_Project_Requirements.pdf"
        )
        file2 = File(
            workspace_id=workspace1.id,
            owner_id=users[1].id,
            original_filename="API_Documentation.docx",
            stored_filename="def456_API_Documentation.docx",
            file_type="document",
            file_size=1800000,
            file_path="./uploads/files/1/def456_API_Documentation.docx"
        )
        
        db.add_all([file1, file2])
        db.commit()
        print("Created files")
        
        # Create notifications
        notif1 = Notification(
            workspace_id=workspace1.id,
            user_id=users[0].id,
            type="info",
            title="Team Member Added",
            message="Sara Miller has been added to your workspace"
        )
        notif2 = Notification(
            workspace_id=workspace1.id,
            user_id=users[0].id,
            type="success",
            title="Task Completed",
            message="Landing page redesign task has been marked as complete"
        )
        
        db.add_all([notif1, notif2])
        db.commit()
        print("Created notifications")
        
        print("Database seeding completed successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
