---
description: How to deploy code to the live Hostinger VPS
---

# Hostinger VPS Deployment Playbook (DOCKER ENVIRONMENT)

> [!WARNING]  
> **CRITICAL MEMORY FOR AI AGENTS**: As of April 2026, the Main Domain (`usaaffiliatemarketing.com`) has been **strictly and permanently transitioned to DOCKER**.   
> You must **NEVER** use `pm2` commands for deployment. 
> You must **NEVER** overwrite the `.env.prod` file with Test Database credentials.

This project is deployed on a Hostinger VPS via GitHub integration. Whenever you write new code, you MUST follow this Docker-based automated workflow to push the code live. 

## Strict Docker Deployment Steps

1. **Commit to GitHub**
Commit all your working changes to the `main` branch.
// turbo
```bash
git add .
git commit -m "System updates"
git push origin main
```

2. **Run VPS Pull & Docker Build Script**
SSH into the Hostinger VPS (76.13.244.202) and execute the Docker compose production rebuild. This correctly uses `network_mode: "host"` to communicate securely with the Native MongoDB instance running on the VPS. 
// turbo
```bash
node scripts/ssh_runner.js "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build frontend backend"
```

## Immutable Architecture Rules
1. **Ports:** The live Nginx server routes `localhost:3000` (Frontend) and `localhost:5050` (Backend API). Docker seamlessly binds to these due to `network_mode: "host"`.
2. **Database:** The LIVE database is `universal_game_core_v1` running native on the VPS `127.0.0.1:27017`. Only the `docker-compose.test.yml` relies on an internal Mongo container.
3. **PM2 is Dead:** Do not attempt to run `npm run build` locally on the server or `pm2 start`. Docker handles everything via `docker-compose.prod.yml`.
