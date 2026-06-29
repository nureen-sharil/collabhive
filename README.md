# CollabHive App Prototype

Full-stack collaborative workspace app — React + Vite frontend, FastAPI backend, MySQL database.

## Prerequisites

Install the following before you start:

- [Node.js](https://nodejs.org/) v18 or later
- [Python](https://python.org/) 3.11 or later
- [XAMPP](https://www.apachefriends.org/) (or any MySQL 8 server running on port **3306** or **3307**)

---

## 1 — Clone the repository

```bash
git clone <your-github-repo-url>
cd collabhive
```

---

## 2 — Set up the database

1. Start XAMPP and make sure **Apache** and **MySQL** are running.
2. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Click **New** (left sidebar) and create a database called **`collab_hive`**.
4. Select the `collab_hive` database → click the **Import** tab.
5. Click **Choose File**, select `database/collab_hive.sql` from this repo, then click **Go**.

The `users` and `chat_messages` tables will be created automatically.

---

## 3 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and update these values to match your MySQL setup:

```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/collab_hive
```

If your MySQL runs on port **3307** (common with XAMPP), change `3306` → `3307`.  
If your MySQL `root` user has a password, add it: `root:yourpassword@`.

---

## 4 — Install backend dependencies

```bash
# still inside /backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install fastapi uvicorn sqlalchemy pymysql bcrypt email-validator
```

---

## 5 — Run the backend

```bash
venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

---

## 6 — Install frontend dependencies

```bash
# from the project root (collabhive/)
npm install
```

---

## 7 — Run the frontend

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Deploy Frontend to Vercel

When importing this repository into Vercel, use:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Add this environment variable in the Vercel project settings:

```env
VITE_API_URL=https://collabhive-4.onrender.com
```

For local development, copy `.env.example` to `.env` and keep:

```env
VITE_API_URL=http://localhost:8000
```

---

## Project structure

```
collabhive/
├── backend/          FastAPI backend
│   ├── main.py       API routes + DB models
│   └── .env.example  Copy to .env and fill in your DB URL
├── database/
│   └── collab_hive.sql   Database schema (import this)
├── src/              React + Vite frontend
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Can't connect to MySQL server` | Make sure XAMPP MySQL is running and the port in `.env` is correct |
| `Access denied for user 'root'` | Check the password in your `.env` DATABASE_URL |
| `Unknown database 'collab_hive'` | Create the database in phpMyAdmin first, then import the SQL |
| Frontend shows blank page | Make sure both the backend (port 8000) and frontend (port 5173) are running |

  
