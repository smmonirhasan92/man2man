#!/bin/bash
set -e
echo "Starting V7.2 Deployment Script..."

# Ensure at least 2GB of swap is active to prevent OOM
if ! swapon --show | grep -q 'swapfile2'; then
    echo "Creating new 2GB swapfile..."
    dd if=/dev/zero of=/swapfile2 bs=1M count=2048 || true
    chmod 600 /swapfile2
    mkswap /swapfile2 || true
    swapon /swapfile2 || true
else
    echo "Swapfile already exists."
fi

# Navigate to project and pull latest changes
cd /var/www/man2man
echo "Pulling latest code from main branch..."
git pull origin main

# Build frontend with increased Node memory limit
cd frontend
echo "Cleaning old build files..."
rm -rf .next
echo "Building V7.2 with expanded memory limit..."
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

# Restart PM2
echo "Restarting application via PM2..."
pm2 restart all

echo "V7.2 DEPLOYMENT SUCCESSFUL!"
