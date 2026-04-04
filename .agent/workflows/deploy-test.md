---
description: Deploy updated local code to the VPS Test Server (Staging)
---

# VPS Test Server Deployment Guide

This workflow flawlessly synchronizes your local development codebase with the VPS Test Environment (IP: 76.13.244.202) using Docker. It guarantees that live production databases and domain traffic remain untouched while you verify your new features.

## Prerequisites
- You have thoroughly tested your changes locally (`http://localhost:3010`).
- You are ready to view these changes on the Staging/Test Server.

## Execution Steps

1. **Commit and Push Code**
   Pushes the finalized local code to GitHub's `main` branch.
// turbo
```bash
git add .
git commit -m "Auto-Deployment: Syncing local changes to Test Environment"
git push origin main
```

2. **Deploy to Test VPS (Automated Action)**  
   Connects to the VPS, pulls the latest code, and completely rebuilds the test-specific Docker containers via Docker Compose.
// turbo
```bash
node scripts/ssh_runner.js "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.test.yml down && docker compose -f docker-compose.test.yml up -d --build"
```

## Post-Deployment Workflow
- **Verify:** Wait 1-2 minutes for the VPS build to finish, then go to your Test UI (`http://76.13.244.202:3011` for frontend) to ensure everything reflects correctly.
- **Go Live:** If testing is successful, run the `/deploy` command to push these exact changes to the actual live website (`usaaffiliatemarketing.com`).
