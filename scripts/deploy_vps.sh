#!/bin/bash

# --- Man2Man Zero-Downtime VPS Deployer (V7.2 - Docker V2 Optimized) ---

echo "[1/5] Skipping Git Pull (Standalone VPS Takeover)..."

echo "[2/5] Building fresh Docker images (No-Cache)..."
docker compose -f docker-compose.prod.yml build --pull --no-cache

echo "[3/5] Setting folder permissions for Docker volumes..."
sudo chown -R 1000:1000 ./uploads ./logs 2>/dev/null || echo "⚠️ Warning: Permissions issue."
chmod -R 777 ./uploads ./logs 2>/dev/null || true

echo "[4/5] Starting new containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

max_retries=15
retry_count=0
success=false

while [ $retry_count -lt $max_retries ]; do
    backend_health=$(docker inspect --format='{{.State.Health.Status}}' m2m-backend 2>/dev/null)
    frontend_health=$(docker inspect --format='{{.State.Health.Status}}' m2m-frontend 2>/dev/null)

    if [ "$backend_health" == "healthy" ] && [ "$frontend_health" == "healthy" ]; then
        echo "✅ SUCCESS: Both Docker containers are HEALTHY."
        success=true
        break
    else
        echo "⏳ Waiting for Docker healthchecks... ($retry_count/$max_retries) - Backend: $backend_health, Frontend: $frontend_health"
        sleep 10
        retry_count=$((retry_count+1))
    fi
done

if [ "$success" = false ]; then
    echo "⚠️ CRITICAL: Docker Healthcheck timed out! Site remains on PM2."
    docker compose -f docker-compose.prod.yml down
    exit 1
else
    echo "🚀 Docker is HEALTHY. Switching Nginx and stopping PM2..."
    
    NGINX_CONF="/etc/nginx/sites-available/default"
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
