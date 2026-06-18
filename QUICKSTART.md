# Quick Start Guide

Get CollabHive up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 18+

# Check Python
python --version  # Should be 3.9+

# Check MySQL (if using MySQL)
mysql --version
```

## Step 1: Install Dependencies (2 minutes)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

## Step 2: Set Up Environment Variables (1 minute)

### Frontend
```bash
# Copy example file
cp .env.example .env

# .env should contain:
# VITE_API_URL=http://localhost:8000
```

### Backend
```bash
# Copy example file
cd backend
cp .env.example .env
cd ..

# Edit backend/.env with your database connection:
# For SQLite (easiest for development):
# DATABASE_URL=sqlite:///./collab_hive.db

# For MySQL:
# DATABASE_URL=mysql+pymysql://root:password@localhost:3306/collab_hive
```

## Step 3: Initialize Database (1 minute)

```bash
cd backend

# Create database tables and seed sample data
python seed_db.py

cd ..
```

## Step 4: Start the Application (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
python main.py

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev

# You should see:
# VITE v4.4.0  ready in 234 ms
# ➜  Local:   http://localhost:5173/
```

## Step 5: Open and Test (No time!)

1. Open http://localhost:5173 in your browser
2. Click "Login"
3. Use demo credentials:
   - **Email**: seroja.jane@collabhive.io
   - **Password**: password123
4. Explore the application!

## Testing the API

Visit http://localhost:8000/api/docs to see:
- Interactive API documentation
- Test all endpoints directly
- View request/response examples

## Database Management

### View SQLite Database
```bash
# Install SQLite CLI
sudo apt-get install sqlite3  # Ubuntu/Debian

# Open database
cd backend
sqlite3 collab_hive.db

# Common commands
.tables                 # List all tables
SELECT * FROM users;   # View users
.schema users           # View table structure
.exit                   # Exit
```

### View MySQL Database
```bash
mysql -u root -p
USE collab_hive;
SELECT * FROM users;
SHOW TABLES;
```

## Troubleshooting

### Backend won't start
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Frontend won't connect to API
1. Verify backend is running (http://localhost:8000/health)
2. Check VITE_API_URL in .env
3. Restart frontend: `npm run dev`

### Database errors
```bash
# For SQLite issues
rm -f backend/collab_hive.db
python seed_db.py

# For MySQL issues
mysql -u root -p
DROP DATABASE collab_hive;
CREATE DATABASE collab_hive;
python seed_db.py
```

### Import errors
```bash
# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

## Demo Accounts

All demo users have password: `password123`

- 📧 seroja.jane@collabhive.io - Frontend Developer
- 📧 john.doe@collabhive.io - Backend Developer
- 📧 sara.miller@collabhive.io - Project Manager
- 📧 alex.brown@collabhive.io - Designer
- 📧 natasha.k@collabhive.io - QA Engineer

## What Can You Do?

### Workspaces
✅ Create new workspaces
✅ View workspace overview with statistics
✅ Manage workspace members
✅ Track progress and status

### Tasks
✅ Create and assign tasks
✅ Set priorities and due dates
✅ Track progress
✅ Add comments
✅ Filter by status, priority, or assignee

### Meetings
✅ Create meeting polls
✅ Add time slot options
✅ Vote for preferred times
✅ View voting statistics

### Chat
✅ Send team messages
✅ Share files and attachments
✅ View message history
✅ See team member status

### Files
✅ Upload workspace files
✅ Share files via links
✅ Download files
✅ Organize by type

### Notifications
✅ Receive workspace notifications
✅ Mark as read
✅ Delete notifications

## Next Steps

1. **Explore the UI**: Spend 10 minutes clicking around
2. **Read the docs**: Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. **Deploy**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Customize**: Modify colors, branding, features
5. **Integrate**: Connect to your own backend systems

## Useful Links

- 📖 [Full Setup Guide](./SETUP_GUIDE.md)
- 🗄️ [Database Schema](./DATABASE_SCHEMA.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 📚 [API Documentation](http://localhost:8000/api/docs)
- 🎨 [Figma Design](https://www.figma.com/design/RffEqxOaWSN26RIULY5CUH/CollabHive-App-Prototype)

## Need Help?

1. Check the browser console (F12) for error messages
2. Check the backend logs in terminal
3. Verify all .env variables are set
4. Ensure ports 5173 (frontend) and 8000 (backend) are available
5. Review the [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Stopping the Application

```bash
# Stop backend
# Press Ctrl+C in backend terminal

# Stop frontend
# Press Ctrl+C in frontend terminal

# Kill stuck processes (if needed)
lsof -ti:8000 | xargs kill -9  # Backend port
lsof -ti:5173 | xargs kill -9  # Frontend port
```

Enjoy CollabHive! 🚀
