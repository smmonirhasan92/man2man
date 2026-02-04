# 🚀 USA Afiliat marking Deployment Guide

This guide provides step-by-step instructions for deploying the **USA Afiliat marking** application (Frontend & Backend).

## 🏗️ Tech Stack

*   **Frontend**: Next.js 16 (React 19), Tailwind CSS v4
*   **Backend**: Node.js, Express.js, Sequelize ORM
*   **Database**: MySQL (Required)

---

## ✅ Prerequisites

Ensure the deployment server has the following installed:

1.  **Node.js**: v18.17.0 or higher (Recommended: v20 LTS).
2.  **MySQL Server**: v8.0 or higher.
3.  **Git**: For cloning the repository.
4.  **Process Manager**: `pm2` (recommended for keeping the backend running).
    *   Install: `npm install -g pm2`

---

## 🛠️ Backend Setup

### 1. Installation

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Configuration (`.env`)

Create a `.env` file in the `backend/` directory based on the following template. **You must provide your MySQL database credentials.**

```env
PORT=5000
DB_HOST=127.0.0.1
DB_USER=your_db_user      # ⚠️ CHANGE THIS
DB_PASSWORD=your_db_pass  # ⚠️ CHANGE THIS
DB_NAME=walet-game        # ⚠️ CHANGE THIS
JWT_SECRET=supersecretkeyremitwallet123 # ⚠️ CHANGE THIS FOR PRODUCTION
NODE_ENV=production
```

### 3. Database Setup

1.  Create an empty MySQL database named `walet-game` (or whatever you set in `DB_NAME`).
2.  The application uses Sequelize to automatically create tables.
3.  When you start the server, it will verify the connection and sync tables.

### 4. Running the Backend

**Development:**
```bash
npm run dev
```

**Production (using PM2):**
Start the server and keep it running in the background.

```bash
# Start with PM2
pm2 start server.js --name "remitwallet-backend"

# Save PM2 list to respawn on reboot
pm2 save
pm2 startup
```

---

## 🎨 Frontend Setup

### 1. Installation

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install --legacy-peer-deps
```
*Note: `legacy-peer-deps` might be needed depending on strict dependency versions.*

### 2. Configuration (`.env.local`)

Create a `.env.local` file in the `frontend/` directory to point to your live backend API.

```env
# URL of your deployed backend (e.g. https://api.yourdomain.com/api)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Build & Run

**Development:**
```bash
npm run dev
```

**Production:**
Build the Next.js application for production.

```bash
npm run build
npm start
```

**Production (using PM2):**

```bash
# Start with PM2
pm2 start npm --name "remitwallet-frontend" -- start
```

---

## 🌐 Reverse Proxy (Nginx) Example

If deploying on a VPS (Ubuntu/Linux), use Nginx to forward traffic.

**Backend Configuration (API)**:
Forward `/api` requests to `localhost:5000`.

**Frontend Configuration**:
Forward root request to `localhost:3000`.

---

## 📂 Project Structure Reference

For a detailed map of the file structure, see [PROJECT_MAP.md](./PROJECT_MAP.md).
