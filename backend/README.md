# CollabHive — Backend Documentation

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Database Configuration](#database-configuration)
4. [Schema Overview](#schema-overview)
5. [Installation & Setup](#installation--setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Server](#running-the-server)
8. [API Reference](#api-reference)
9. [Authentication & Security](#authentication--security)
10. [Third-Party Libraries](#third-party-libraries)
11. [Auto-Schema Migration](#auto-schema-migration)
12. [Development Notes & Constraints](#development-notes--constraints)

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Python | 3.10+ |
| Web Framework | FastAPI | Latest |
| ASGI Server | Uvicorn | Latest |
| ORM | SQLAlchemy | Latest |
| Database Driver | PyMySQL | Latest |
| Data Validation | Pydantic v2 | Latest |
| Password Hashing | bcrypt | Latest |
| Environment Vars | python-dotenv | Latest |

---

## Project Structure

```
backend/
├── main.py            # Entry point — all models, schemas, routes, and startup logic
├── .env               # Local environment variables (not committed to source control)
├── .env.example       # Template for environment variables
└── app/
    ├── models.py      # Reserved for future model extraction (currently empty)
    └── security.py    # Reserved for future security utilities (currently empty)
```

> All application logic currently lives in `main.py`. It includes database models, Pydantic schemas, dependency injection, and all route handlers in one file.

---

## Database Configuration

CollabHive uses **MySQL** as its relational database, accessed via **SQLAlchemy** with the **PyMySQL** driver.

The connection string follows this format:

```
mysql+pymysql://<user>:<password>@<host>:<port>/<database>
```

**Common configurations:**

| Setup | Connection String |
|---|---|
| XAMPP (no password, default port) | `mysql+pymysql://root:@mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:3306/collab_hive` |
| XAMPP (no password, port 3307) | `mysql+pymysql://root:@mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:3307/collab_hive` |
| XAMPP (with password) | `mysql+pymysql://root:yourpassword@mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:3306/collab_hive` |
| Custom / production | `mysql+pymysql://user:password@host:port/collab_hive` |

The database name must be `collab_hive`. Create it manually in MySQL before first run:

```sql
CREATE DATABASE collab_hive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Schema Overview

SQLAlchemy automatically creates all tables on startup via `Base.metadata.create_all()`. A reference SQL script is also available at `database/collab_hive.sql`.

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `name` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |

### `workspaces`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `workspace_name` | VARCHAR(100) | NOT NULL |
| `description` | TEXT | nullable |
| `owner_id` | INT | FK → `users.id` ON DELETE CASCADE |
| `color` | VARCHAR(7) | NOT NULL, default `#2563EB` |
| `progress` | INT | NOT NULL, default `0` |
| `deadline` | VARCHAR(50) | nullable |
| `created_at` | DATETIME | NOT NULL, default now |
| `updated_at` | DATETIME | NOT NULL, auto-updated |

### `workspace_members`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `workspace_id` | INT | FK → `workspaces.id` ON DELETE CASCADE |
| `user_id` | INT | FK → `users.id` ON DELETE CASCADE |
| `role` | VARCHAR(20) | `owner` or `member` |
| `joined_at` | DATETIME | NOT NULL, default now |

> Unique constraint on `(workspace_id, user_id)` prevents duplicate memberships.

### `chat_messages`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `workspace_id` | VARCHAR(100) | NOT NULL, indexed |
| `sender_id` | INT | NOT NULL, FK (logical) → `users.id` |
| `receiver_id` | INT | nullable |
| `message_text` | TEXT | NOT NULL, default `""` |
| `attachment_type` | VARCHAR(20) | nullable (`image`, `file`, etc.) |
| `attachment_name` | VARCHAR(255) | nullable |
| `attachment_url` | TEXT | nullable |
| `voice_duration` | VARCHAR(20) | nullable |
| `created_at` | DATETIME | NOT NULL, default now |

> `workspace_id` in this table is stored as `VARCHAR(100)` (string), not an integer foreign key.

### `meeting_polls`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `workspace_id` | INT | FK → `workspaces.id` ON DELETE CASCADE |
| `agenda` | VARCHAR(255) | NOT NULL |
| `deadline` | VARCHAR(100) | NOT NULL, default `""` |
| `created_at` | DATETIME | NOT NULL, default now |

### `meeting_time_slots`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `meeting_id` | INT | FK → `meeting_polls.id` ON DELETE CASCADE |
| `slot_order` | INT | NOT NULL, default `0` |
| `date` | VARCHAR(100) | NOT NULL |
| `time` | VARCHAR(100) | NOT NULL |

### `meeting_votes`
| Column | Type | Constraints |
|---|---|---|
| `id` | INT | PK, auto-increment |
| `meeting_id` | INT | FK → `meeting_polls.id` ON DELETE CASCADE |
| `slot_id` | INT | FK → `meeting_time_slots.id` ON DELETE CASCADE |
| `user_id` | INT | FK → `users.id` ON DELETE CASCADE |
| `created_at` | DATETIME | NOT NULL, default now |

> Unique constraint `uq_meeting_vote_user` on `(meeting_id, user_id)` enforces one vote per user per poll at the database level.

### Entity Relationship Summary

```
users ──< workspace_members >── workspaces
                                    │
                               meeting_polls
                                    │
                           meeting_time_slots
                                    │
                             meeting_votes >── users
```

---

## Installation & Setup

### Prerequisites

- Python 3.10 or higher
- MySQL 8.x (or compatible — XAMPP, WAMP, standalone)
- `pip` or a virtual environment manager

### Steps

1. **Clone the repository and navigate to the backend folder:**
   ```bash
   cd collabhive/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   python -m venv ../.venv
   ../.venv/Scripts/Activate.ps1

   # macOS / Linux
   python -m venv ../.venv
   source ../.venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn sqlalchemy pymysql bcrypt pydantic[email] python-dotenv
   ```

4. **Create the MySQL database:**
   ```sql
   CREATE DATABASE collab_hive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   Alternatively, run the provided SQL script:
   ```bash
   mysql -u root -p collab_hive < ../database/collab_hive.sql
   ```

5. **Configure your environment** (see [Environment Configuration](#environment-configuration)).

6. **Start the server** (see [Running the Server](#running-the-server)).

---

## Environment Configuration

Copy the provided template and fill in your values:

```bash
cp .env.example .env
```

`.env` contents:

```env
# MySQL connection string
DATABASE_URL=mysql+pymysql://root:@mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:3306/collab_hive
```

**Never commit the `.env` file to source control.** It is already listed in `.gitignore`.

If no `.env` file is present, the server falls back to:
```
mysql+pymysql://root:1234@mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:3307/collab_hive
```

---

## Running the Server

```bash
# Development (with auto-reload)
python -m uvicorn main:app --reload

# Development on a custom port
python -m uvicorn main:app --reload --port 8001

# Production (no reload, bound to all interfaces)
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The server runs at `http://mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:8000` by default.

Interactive API docs (provided automatically by FastAPI):
- **Swagger UI:** `http://mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:8000/docs`
- **ReDoc:** `http://mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:8000/redoc`

---

## API Reference

All endpoints are prefixed with `/api`.

---

### Authentication

#### `POST /api/register`
Register a new user account.

**Request body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securepassword"
}
```

**Responses:**
- `200` — `{ "message": "User registered successfully" }`
- `409` — Email already registered

---

#### `POST /api/login`
Authenticate a user and return their profile.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "securepassword"
}
```

**Responses:**
- `200` — `{ "id": 1, "name": "Alice", "email": "alice@example.com" }`
- `401` — Incorrect email or password

---

#### `GET /api/users/by-email/{email}`
Look up a user by their email address. Used for workspace member invitations.

**Response:** `UserResponse` object or `404`.

---

### Workspaces

#### `POST /api/workspaces`
Create a new workspace. The creator is automatically added as the `owner` member.

**Request body:**
```json
{
  "workspace_name": "Team Alpha",
  "description": "Optional description",
  "color": "#2563EB",
  "owner_id": 1,
  "member_emails": ["bob@example.com", "carol@example.com"],
  "deadline": "2026-12-31"
}
```

**Responses:** `201` with `WorkspaceResponse`, or `400` / `404` on validation failure.

---

#### `GET /api/users/{user_id}/workspaces`
Retrieve all workspaces the user belongs to (as owner or member).

**Response:** Array of `WorkspaceResponse`.

---

#### `GET /api/workspaces/{workspace_id}?current_user_id={user_id}`
Retrieve a single workspace. Requires the requester to be a member.

**Response:** `WorkspaceResponse` or `403` / `404`.

---

#### `PUT /api/workspaces/{workspace_id}?current_user_id={user_id}`
Update workspace metadata. Only the workspace owner can do this.

**Request body** (all fields optional):
```json
{
  "workspace_name": "New Name",
  "description": "Updated description",
  "color": "#16A34A",
  "progress": 50,
  "deadline": "2027-01-01"
}
```

**Responses:** `200` with updated `WorkspaceResponse`, `403` if not owner, `404` if not found.

---

#### `DELETE /api/workspaces/{workspace_id}?current_user_id={user_id}`
Permanently delete a workspace and all its associated data (cascades to members, meetings, votes, messages). Owner-only.

**Responses:** `200` with success message, `403` if not owner, `404` if not found.

---

#### `POST /api/workspaces/{workspace_id}/join`
Add a user to a workspace as a member. Idempotent — re-joining an existing member does nothing.

**Request body:**
```json
{ "user_id": 5 }
```

**Response:** `WorkspaceResponse` with updated members list.

---

### Meeting Scheduler

#### `GET /api/workspaces/{workspace_id}/meetings?current_user_id={user_id}`
Retrieve all meeting polls for a workspace. Passing `current_user_id` populates the `selectedSlot` field with the slot the user voted for (or `null` if they have not voted yet).

**Response:** Array of `MeetingPollResponse`.

---

#### `POST /api/workspaces/{workspace_id}/meetings`
Create a new meeting poll with time slot options.

**Request body:**
```json
{
  "workspace_id": 3,
  "agenda": "Sprint planning",
  "deadline": "July 5, 2026",
  "slots": [
    { "date": "Jun 30, 2026", "time": "09:00 AM – 10:00 AM" },
    { "date": "Jul 1, 2026",  "time": "02:00 PM – 03:00 PM" }
  ]
}
```

**Responses:** `201` with `MeetingPollResponse`, or `400` / `404` on validation failure.

---

#### `POST /api/meetings/{meeting_id}/vote`
Submit or look up a vote for a meeting time slot. **One vote per user per poll is enforced at both the application and database level.** If the user has already voted, the existing poll state is returned without modification.

**Request body:**
```json
{
  "user_id": 1,
  "slot_id": 7
}
```

**Responses:** `200` with updated `MeetingPollResponse`, `403` if not a workspace member, `404` if poll or slot not found.

---

### Group Chat

#### `GET /api/workspaces/{workspace_id}/messages`
Retrieve all messages for a workspace in chronological order.

**Response:** Array of `ChatMessageResponse`.

---

#### `POST /api/workspaces/{workspace_id}/messages`
Send a message to a workspace chat. Supports plain text, file attachments, and voice notes.

**Request body:**
```json
{
  "senderId": 1,
  "receiverId": null,
  "messageText": "Hello team!",
  "attachmentType": null,
  "attachmentName": null,
  "attachmentUrl": null,
  "voiceDuration": null
}
```

At least one of `messageText`, an attachment (`attachmentType` + `attachmentName`), or `voiceDuration` must be provided.

**Response:** `ChatMessageResponse` or `400` / `404`.

---

### Response Schemas

#### `WorkspaceResponse`
```json
{
  "id": 1,
  "workspace_name": "Team Alpha",
  "description": "...",
  "owner_id": 1,
  "color": "#2563EB",
  "progress": 0,
  "deadline": "2026-12-31",
  "created_at": "2026-06-27T10:00:00",
  "members": [
    { "user_id": 1, "name": "Alice", "email": "alice@example.com", "role": "owner" }
  ]
}
```

#### `MeetingPollResponse`
```json
{
  "id": 5,
  "workspace_id": 3,
  "agenda": "Sprint planning",
  "totalVotes": 4,
  "votedCount": 2,
  "deadline": "July 5, 2026",
  "selectedSlot": 7,
  "timeSlots": [
    { "id": 7, "date": "Jun 30, 2026", "time": "09:00 AM – 10:00 AM", "votes": 2 },
    { "id": 8, "date": "Jul 1, 2026",  "time": "02:00 PM – 03:00 PM", "votes": 0 }
  ]
}
```

---

## Authentication & Security

### Password Hashing
User passwords are hashed using **bcrypt** with a randomly generated salt before storage. Plain-text passwords are never persisted. On login, `bcrypt.checkpw` is used to verify the submitted password against the stored hash.

### Session Management
There is no server-side session or token system. After a successful login, the server returns the user's `id`, `name`, and `email`. The frontend stores this in `localStorage` and sends `user_id` as a query parameter or in request bodies for endpoints that require identity verification.

> **Note for maintainers:** This is a simplified authentication model suited for academic/prototype use. For production deployment, replace this with JWT-based authentication (e.g., using `python-jose`) with short-lived access tokens and refresh token rotation.

### Membership Guard
The `verify_membership(workspace_id, user_id, db)` dependency is called at the start of any endpoint that accesses workspace-scoped data. It raises `HTTP 403` if the user is not a member, preventing cross-workspace data access.

### Vote Uniqueness
The `meeting_votes` table has a database-level `UNIQUE` constraint on `(meeting_id, user_id)`. The application layer also performs an explicit duplicate check before inserting, returning the current poll state without modification if a duplicate is detected.

### CORS
CORS is currently configured to allow all origins (`allow_origins=["*"]`), all methods, and all headers. This is intentional for local development. **Restrict `allow_origins` to specific frontend domains before any public deployment.**

---

## Third-Party Libraries

| Library | Purpose | Install |
|---|---|---|
| `fastapi` | Web framework and automatic OpenAPI documentation | `pip install fastapi` |
| `uvicorn` | ASGI server for running FastAPI | `pip install uvicorn` |
| `sqlalchemy` | ORM for database models and query building | `pip install sqlalchemy` |
| `pymysql` | Pure-Python MySQL driver used by SQLAlchemy | `pip install pymysql` |
| `bcrypt` | Secure password hashing | `pip install bcrypt` |
| `pydantic[email]` | Request/response validation and `EmailStr` type | `pip install pydantic[email]` |
| `python-dotenv` | Loads `.env` file into `os.environ` | `pip install python-dotenv` |

Install all at once:
```bash
pip install fastapi uvicorn sqlalchemy pymysql bcrypt "pydantic[email]" python-dotenv
```

---

## Auto-Schema Migration

On every startup, the backend performs two schema operations automatically:

1. **`Base.metadata.create_all(bind=engine)`** — Creates any tables that do not yet exist in the connected database. Existing tables are left untouched; this is additive only.

2. **`ensure_chat_message_schema()`** — Inspects the `chat_messages` table and issues `ALTER TABLE ... ADD COLUMN` statements for any of the four attachment/voice columns that are missing. This handles upgrades from older schema versions that predate attachment support.

These operations run synchronously at import time. If the database is unavailable at startup, the server will fail to start.

---

## Development Notes & Constraints

### Type Inconsistency: `chat_messages.workspace_id`
The `workspace_id` column in `chat_messages` is `VARCHAR(100)` (string), while in all other tables it is an `INT` (foreign key). This is a legacy design. The chat endpoints accept any string workspace identifier and do not enforce a foreign key constraint to `workspaces`.

### No Soft Deletes
All delete operations are hard deletes. Cascading `ON DELETE CASCADE` foreign keys are used throughout, so deleting a workspace removes all its members, meetings, time slots, votes, and chat messages from the database permanently.

### Progress Field
`workspaces.progress` is a plain integer (`0`–`100`) managed entirely by the frontend. There is no server-side computation of progress.

### Meeting Deadline Format
`meeting_polls.deadline` and `workspaces.deadline` are stored as plain strings (e.g., `"July 5, 2026"` or `"2026-12-31"`). No date parsing or timezone handling is performed by the backend.

### Single-File Architecture
All application code lives in `main.py`. As the codebase grows, consider splitting into:
- `app/models.py` — SQLAlchemy ORM models
- `app/schemas.py` — Pydantic request/response models
- `app/routers/` — Route handlers grouped by feature
- `app/dependencies.py` — Shared dependencies (`get_db`, `verify_membership`)

### Local Development Default Port
The default Uvicorn port is `8000`. The frontend expects the backend at `http://mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:8000` unless `VITE_API_BASE_URL` is set in the frontend's `.env`.
