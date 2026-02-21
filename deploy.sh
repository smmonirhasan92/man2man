#!/bin/bash

# ==============================================================================
# VPS PRODUCTION MANUAL DEPLOYMENT SCRIPT
# ==============================================================================
# This script is used to safely pull the latest changes from the main branch
# and restart the production server without affecting the Vercel staging environment.

echo "🚀 Starting Production Deployment..."

# 1. Pull latest code from GitHub
echo "📥 Pulling latest code from main branch..."
git pull origin main

# 2. Install Dependencies (Backend)
echo "📦 Installing backend dependencies..."
npm install

# 3. Install Dependencies (Frontend) - if applicable for VPS
# If VPS is only serving as backend, we can skip frontend build,
# but if it serves both, we need to build frontend.
# Checking if frontend directory exists
if [ -d "frontend" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    
    echo "🏗️ Building frontend..."
    npm run build
    cd ..
fi

# 4. Restart PM2 with production environment
echo "🔄 Restarting PM2 processes..."
# Utilizing the standalone ecosystem configuration for production
pm2 startOrRestart ecosystem.config.js --env production

echo "✅ Deployment Successful!"
echo "Current PM2 Status:"
pm2 status
