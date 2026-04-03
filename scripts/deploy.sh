#!/bin/bash

# --- Man2Man Zero-Downtime Deployer ---
# This script ensures the production VPS is updated with minimal to zero downtime.

echo "[1/5] Pulling latest changes from Git..."
git pull origin main

echo "[2/5] Building fresh Docker images (No-Cache)..."
# [V7.1] --pull ensures latest base, --no-cache ensures no stale code leaks
    echo "⚠️ CRITICAL: Docker Healthcheck timed out! Site remains on PM2."
    docker compose -f docker-compose.prod.yml down
    exit 1
else
    echo "🚀 Docker is HEALTHY. Switching Nginx and stopping PM2..."
    
    # [V7.1 PRO] Automating Nginx Switch (Placeholder path - adjust on server if needed)
    # This logic swaps the proxy port from 5050/3000 to 5010/3010
    NGINX_CONF="/etc/nginx/sites-available/default" # Adjust this path as per user server
    if [ -f "$NGINX_CONF" ]; then
        echo "🔄 Updating Nginx Configuration to Docker ports..."
        sudo sed -i 's/127.0.0.1:3000/127.0.0.1:3010/g' "$NGINX_CONF"
        sudo sed -i 's/127.0.0.1:5050/127.0.0.1:5010/g' "$NGINX_CONF"
        sudo nginx -t && sudo systemctl reload nginx
        echo "✅ Nginx traffic swapped to Docker."
    fi

    pm2 stop man2man-backend || true
    pm2 stop man2man-frontend || true
    echo "✅ DEPLOYMENT COMPLETE! Site is now running on DOCKER."
fi

echo "🧹 Cleaning up old unused images..."
docker image prune -f

echo "MAN2MAN SYSTEMS ARE GO! 🚀"
