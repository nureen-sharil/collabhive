# CollabHive Deployment Guide

This guide provides instructions for deploying CollabHive to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Setup](#database-setup)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Security Checklist](#security-checklist)
- [Monitoring and Logging](#monitoring-and-logging)

## Prerequisites

- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Cloud hosting account (AWS, DigitalOcean, Heroku, etc.)
- MySQL database service
- Node.js 18+ and Python 3.9+ installed on server

## Backend Deployment

### Option 1: Traditional Server (Ubuntu/Debian)

#### 1. Install Dependencies

```bash
sudo apt-get update
sudo apt-get install -y python3.9 python3-pip python3-venv git nginx
```

#### 2. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/your-repo/collabhive.git
cd collabhive/backend
```

#### 3. Set Up Python Environment

```bash
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

#### 4. Configure Environment Variables

```bash
sudo nano .env
```

Production `.env`:
```env
DATABASE_URL=mysql+pymysql://user:password@db-host:3306/collab_hive
SECRET_KEY=your_very_long_secure_secret_key_here_minimum_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["https://yourdomain.com"]
DEBUG=False
HOST=0.0.0.0
PORT=8000
UPLOAD_DIR=/var/www/collabhive/uploads
MAX_FILE_SIZE=52428800
```

#### 5. Create Systemd Service

```bash
sudo nano /etc/systemd/system/collabhive-api.service
```

```ini
[Unit]
Description=CollabHive API
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/collabhive/backend
Environment="PATH=/var/www/collabhive/backend/venv/bin"
ExecStart=/var/www/collabhive/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 --timeout 60 main:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 6. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable collabhive-api
sudo systemctl start collabhive-api
sudo systemctl status collabhive-api
```

#### 7. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/collabhive-api
```

```nginx
upstream collabhive_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://collabhive_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /uploads {
        alias /var/www/collabhive/uploads;
        expires 30d;
    }
}
```

#### 8. Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/collabhive-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. Set Up SSL with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Heroku Deployment

#### 1. Install Heroku CLI

```bash
curl https://cli.heroku.com/install.sh | sh
```

#### 2. Login to Heroku

```bash
heroku login
```

#### 3. Create Heroku App

```bash
cd backend
heroku create collabhive-api
```

#### 4. Add Buildpack

```bash
heroku buildpacks:add heroku/python
```

#### 5. Set Environment Variables

```bash
heroku config:set DATABASE_URL="mysql+pymysql://user:pass@host/db"
heroku config:set SECRET_KEY="your_secret_key"
heroku config:set DEBUG=False
heroku config:set CORS_ORIGINS='["https://yourdomain.com"]'
```

#### 6. Create Procfile

```bash
# In backend directory
echo "web: gunicorn -w 4 main:app" > Procfile
```

#### 7. Deploy

```bash
git push heroku main
heroku logs --tail
```

### Option 3: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]
```

#### 2. Build and Run

```bash
docker build -t collabhive-api .
docker run -p 8000:8000 --env-file .env collabhive-api
```

## Frontend Deployment

### Option 1: Vercel

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Deploy

```bash
vercel
```

#### 3. Set Environment Variables

In Vercel dashboard:
```
VITE_API_URL=https://api.yourdomain.com
```

### Option 2: Netlify

#### 1. Install Netlify CLI

```bash
npm i -g netlify-cli
```

#### 2. Build

```bash
npm run build
```

#### 3. Deploy

```bash
netlify deploy --prod --dir=dist
```

#### 4. Configure Build Settings

In `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[env.production]
  [env.production.context.environment]
    VITE_API_URL = "https://api.yourdomain.com"
```

### Option 3: AWS S3 + CloudFront

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://collabhive-frontend
aws s3api put-bucket-versioning --bucket collabhive-frontend --versioning-configuration Status=Enabled
```

#### 2. Build

```bash
npm run build
```

#### 3. Upload to S3

```bash
aws s3 sync dist/ s3://collabhive-frontend/
```

#### 4. Create CloudFront Distribution

- Use S3 bucket as origin
- Set default root object to `index.html`
- Create custom error responses to serve `index.html` for 404s
- Set cache behaviors appropriately

### Option 4: Traditional Server

#### 1. Install Nginx

```bash
sudo apt-get install -y nginx
```

#### 2. Build Frontend

```bash
npm run build
```

#### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/collabhive
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/collabhive/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://api.yourdomain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/collabhive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Database Setup

### AWS RDS MySQL

#### 1. Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier collabhive-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --enable-automated-backups \
  --publicly-accessible false
```

#### 2. Create Database

```bash
mysql -h endpoint.rds.amazonaws.com -u admin -p
CREATE DATABASE collab_hive;
```

#### 3. Run Migrations

```bash
python seed_db.py --db-url "mysql+pymysql://admin:password@endpoint.rds.amazonaws.com:3306/collab_hive"
```

### DigitalOcean Managed Database

1. Create managed database cluster
2. Configure firewall rules
3. Download CA certificate
4. Update `DATABASE_URL` with cluster connection string

## Environment Configuration

### Production Checklist

```bash
# Security
DEBUG=False
ALLOWED_HOSTS=['yourdomain.com', 'www.yourdomain.com', 'api.yourdomain.com']

# Database
DATABASE_URL=mysql+pymysql://user:strongpassword@db-host:3306/collab_hive

# JWT
SECRET_KEY=generate_with: python -c 'import secrets; print(secrets.token_urlsafe(32))'

# CORS
CORS_ORIGINS=["https://yourdomain.com"]

# File Upload
UPLOAD_DIR=/var/www/collabhive/uploads
MAX_FILE_SIZE=52428800

# Server
DEBUG=False
WORKERS=4
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] DEBUG set to False
- [ ] Strong SECRET_KEY generated
- [ ] Database password changed from default
- [ ] CORS properly configured
- [ ] API rate limiting implemented
- [ ] Firewall rules configured
- [ ] Regular backups enabled
- [ ] Monitoring and logging set up
- [ ] Security headers configured

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Monitoring and Logging

### Backend Logging

```python
# In main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/collabhive-api.log'),
        logging.StreamHandler()
    ]
)
```

### View Logs

```bash
# Systemd logs
sudo journalctl -u collabhive-api -f

# Application logs
tail -f /var/log/collabhive-api.log

# Nginx logs
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

- Use Application Performance Monitoring (APM) tools:
  - New Relic
  - Datadog
  - Application Insights

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > /backups/collab_hive_$DATE.sql
aws s3 cp /backups/collab_hive_$DATE.sql s3://backups/
```

### Uptime Monitoring

- Use services like UptimeRobot or Pingdom
- Configure alerts for downtime
- Monitor API response times

## Troubleshooting

### Backend Issues

```bash
# Check service status
sudo systemctl status collabhive-api

# View recent logs
sudo journalctl -u collabhive-api -n 50

# Test API locally
curl http://localhost:8000/health

# Restart service
sudo systemctl restart collabhive-api
```

### Database Connection Issues

```bash
# Test database connection
mysql -h $HOST -u $USER -p$PASS -e "USE $DB; SELECT 1"

# Check database size
mysql -h $HOST -u $USER -p$PASS $DB -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.tables WHERE table_schema = DATABASE();"
```

### Frontend Issues

- Check browser console for errors
- Verify VITE_API_URL is correctly set
- Test API connectivity with curl
- Check CORS headers in API response

## Scaling Strategies

1. **Horizontal Scaling**
   - Deploy multiple API instances behind load balancer
   - Use auto-scaling groups

2. **Database Scaling**
   - Read replicas for scaling read operations
   - Sharding for very large datasets

3. **Caching**
   - Redis for session storage
   - CDN for static assets
   - API response caching

4. **Queue Management**
   - Celery + RabbitMQ for async tasks
   - Background jobs for file processing

## Zero-Downtime Deployment

```bash
# 1. Deploy new version to canary environment
# 2. Run smoke tests
# 3. Switch portion of traffic
# 4. Monitor metrics
# 5. Complete rollout
# 6. Remove old version
```

## Rollback Procedure

```bash
# Application rollback
git revert <commit-hash>
git push
sudo systemctl restart collabhive-api

# Database rollback
# Restore from backup if needed
mysql < /backups/collab_hive_backup.sql
```
