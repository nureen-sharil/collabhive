# CollabHive Database Schema

## Overview

CollabHive uses a relational database with the following tables and relationships. This document provides the complete SQL schema compatible with MySQL 5.7+.

## Database Creation

```sql
CREATE DATABASE IF NOT EXISTS collab_hive;
USE collab_hive;
```

## Table Schemas

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  role VARCHAR(100),
  avatar_color VARCHAR(7) DEFAULT '#2563EB',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_active (is_active)
);
```

### Workspaces Table

```sql
CREATE TABLE workspaces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#2563EB',
  progress FLOAT DEFAULT 0.0,
  status VARCHAR(50) DEFAULT 'Not Started',
  deadline DATETIME,
  creator_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  INDEX idx_creator (creator_id),
  INDEX idx_title (title)
);
```

### Workspace Members (Many-to-Many)

```sql
CREATE TABLE workspace_members (
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tasks Table

```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('todo', 'inprogress', 'done') DEFAULT 'todo',
  due_date DATETIME,
  progress FLOAT DEFAULT 0.0,
  creator_id INT NOT NULL,
  workspace_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_workspace (workspace_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
);
```

### Task Assignees (Many-to-Many)

```sql
CREATE TABLE task_assignees (
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Task Comments Table

```sql
CREATE TABLE task_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  text TEXT NOT NULL,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_task (task_id),
  INDEX idx_user (user_id)
);
```

### Meetings Table

```sql
CREATE TABLE meetings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workspace_id INT NOT NULL,
  agenda TEXT NOT NULL,
  title VARCHAR(255),
  voting_deadline DATETIME NOT NULL,
  selected_slot_id INT,
  creator_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  INDEX idx_workspace (workspace_id),
  INDEX idx_deadline (voting_deadline)
);
```

### Meeting Time Slots Table

```sql
CREATE TABLE meeting_time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  meeting_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  INDEX idx_meeting (meeting_id)
);
```

### Meeting Attendees (Many-to-Many)

```sql
CREATE TABLE meeting_attendees (
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Meeting Votes (Many-to-Many)

```sql
CREATE TABLE meeting_votes (
  meeting_id INT NOT NULL,
  time_slot_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (meeting_id, time_slot_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (time_slot_id) REFERENCES meeting_time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Chat Messages Table

```sql
CREATE TABLE chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workspace_id INT NOT NULL,
  sender_id INT NOT NULL,
  text TEXT,
  is_voice_message BOOLEAN DEFAULT FALSE,
  voice_duration INT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_workspace (workspace_id),
  INDEX idx_sender (sender_id),
  INDEX idx_timestamp (created_at)
);
```

### Message Attachments Table

```sql
CREATE TABLE message_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  INDEX idx_message (message_id)
);
```

### Files Table

```sql
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workspace_id INT NOT NULL,
  owner_id INT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  share_link VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX idx_workspace (workspace_id),
  INDEX idx_owner (owner_id),
  INDEX idx_shared (is_shared)
);
```

### Notifications Table

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('info', 'success', 'warning', 'alert') DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workspace (workspace_id),
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
);
```

## Indexes Summary

### Performance Indexes

```sql
-- User lookup
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Workspace queries
CREATE INDEX idx_workspaces_creator ON workspaces(creator_id);
CREATE INDEX idx_workspaces_title ON workspaces(title);

-- Task queries
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);

-- Chat queries
CREATE INDEX idx_messages_workspace ON chat_messages(workspace_id);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_messages_timestamp ON chat_messages(created_at);

-- File queries
CREATE INDEX idx_files_workspace ON files(workspace_id);
CREATE INDEX idx_files_owner ON files(owner_id);
CREATE INDEX idx_files_shared ON files(is_shared);

-- Notification queries
CREATE INDEX idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## Entity Relationship Diagram

```
Users
├── Workspaces (creator_id)
├── WorkspaceMembers (many-to-many)
├── Tasks (creator_id)
├── TaskAssignees (many-to-many)
├── ChatMessages (sender_id)
├── Files (owner_id)
├── Meetings (creator_id)
├── MeetingAttendees (many-to-many)
└── Notifications (user_id)

Workspaces
├── WorkspaceMembers (many-to-many with Users)
├── Tasks
├── Meetings
├── ChatMessages
├── Files
└── Notifications

Tasks
├── TaskAssignees (many-to-many with Users)
├── TaskComments
└── Creator (Users)

Meetings
├── MeetingTimeSlots
├── MeetingAttendees (many-to-many with Users)
├── MeetingVotes (many-to-many with TimeSlots and Users)
└── Creator (Users)

ChatMessages
├── MessageAttachments
├── Sender (Users)
└── Workspace

Files
├── Owner (Users)
└── Workspace
```

## Sample Seed Data

### Sample Users

```sql
INSERT INTO users (email, name, password_hash, phone, location, role, avatar_color) VALUES
('seroja.jane@collabhive.io', 'Seroja Jane', '$2b$12$...', '+1234567890', 'San Francisco, CA', 'Frontend Developer', '#2563EB'),
('john.doe@collabhive.io', 'John Doe', '$2b$12$...', '+1234567891', 'New York, NY', 'Backend Developer', '#2563EB'),
('sara.miller@collabhive.io', 'Sara Miller', '$2b$12$...', '+1234567892', 'Boston, MA', 'Project Manager', '#7C3AED'),
('alex.brown@collabhive.io', 'Alex Brown', '$2b$12$...', '+1234567893', 'Austin, TX', 'Designer', '#DB2777'),
('natasha.k@collabhive.io', 'Natasha K.', '$2b$12$...', '+1234567894', 'Seattle, WA', 'QA Engineer', '#16A34A');
```

### Sample Workspaces

```sql
INSERT INTO workspaces (title, description, color, progress, status, deadline, creator_id) VALUES
('Software Methodology Project', 'Software development methodology research and implementation', '#2563EB', 65, 'In Progress', '2026-07-20', 1),
('Software Testing', 'QA and testing framework development', '#7C3AED', 30, 'In Progress', '2026-08-04', 5),
('UI/UX Case Study', 'User interface and experience design case study', '#16A34A', 0, 'Not Started', '2026-08-18', 4);
```

## Backup and Recovery

### Backup Database

```bash
# MySQL
mysqldump -u root -p collab_hive > backup.sql

# Restore
mysql -u root -p collab_hive < backup.sql
```

### Export Data

```bash
# Export to CSV
mysql -u root -p -e "SELECT * FROM workspaces INTO OUTFILE '/tmp/workspaces.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"';" collab_hive
```

## Data Retention Policies

- **User Data**: Retained indefinitely (soft-delete on account deletion)
- **Chat Messages**: Retained indefinitely
- **Files**: Retained indefinitely (can be manually deleted)
- **Notifications**: Retained for 30 days (auto-cleanup optional)
- **Audit Logs**: Add date-based retention as needed

## Constraints and Validations

### Primary Key Constraints

All tables have an auto-incrementing integer primary key.

### Foreign Key Constraints

- Cascading DELETE for workspace members and their data
- Cascading DELETE for related tasks, messages, files
- Restrict DELETE for user deletion (prevents orphaned records)

### Unique Constraints

- User email must be unique
- File share link must be unique (when generated)

### Check Constraints

- Progress fields (0-100)
- Status enums limited to predefined values
- Priority enums limited to predefined values

## Scalability Considerations

1. **Partitioning**: Consider partitioning chat_messages by workspace_id for large deployments
2. **Archiving**: Archive old chat messages and notifications periodically
3. **Read Replicas**: Set up read replicas for reporting queries
4. **Caching**: Implement Redis caching for frequently accessed data
5. **Indexing Strategy**: Review and optimize indexes based on query patterns

## Migration Path

For existing databases, use Alembic for migrations:

```bash
# Generate migration
alembic revision --autogenerate -m "Add new column"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```
