# USA Affiliate & Lottery System - Deployment Guide

## Prerequisites
- Node.js v18+
- MongoDB v5+ (Local or Atlas)
- PM2 (Process Manager) -> `npm install -g pm2`

## Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and Secrets
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

## Running with PM2 (Production)

We have provided a `ecosystem.config.js` (if available) or you can use the commands below:

```bash
# Start Backend
pm2 start backend/server.js --name "usa-backend"

# Start Frontend (Next.js)
cd frontend
pm2 start npm --name "usa-frontend" -- start
```

## Environment Variables (.env)

Ensure you have the following keys in `backend/.env`:
- `PORT=5050`
- `MONGO_URI=mongodb://localhost:27017/universal_game_core_v1`
- `JWT_SECRET=your_jwt_secret`
- `SOCKET_PORT=5051`

And in `frontend/.env.local`:
- `NEXT_PUBLIC_API_URL=http://localhost:5050`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:5051`

## PWA & Mobile
The application is PWA ready.
- **Manifest**: Located in `frontend/public/manifest.json`
- **Icons**: Located in `frontend/public/logo.png`
