# Aegis System Deployment Guide

## Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/aegis-system.git
cd aegis-system
```

2. **Setup Backend**
```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values

# Setup database
alembic upgrade head

# Run backend
uvicorn backend.app.main:app --reload
```

3. **Setup Frontend**
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your actual values

# Run frontend
npm run dev
```

## Environment Variables Required

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT secret key
- `UPLOAD_DIR`: File upload directory

### Frontend (.env)
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket URL

## Production Deployment

### Option 1: Docker (Recommended)
```bash
docker-compose up -d
```

### Option 2: Manual Deployment
1. Deploy backend to cloud server
2. Deploy frontend to Vercel/Netlify
3. Configure environment variables
4. Setup database and Redis

## Security Notes
- Never commit .env files to Git
- Use strong secrets in production
- Enable HTTPS in production
- Configure firewall rules
