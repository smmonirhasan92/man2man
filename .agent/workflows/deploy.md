---
description: How to deploy code to the live Hostinger VPS
---

# Hostinger VPS Deployment Playbook

This project is deployed on a Hostinger VPS via GitHub integration. Whenever you write new code, you MUST follow this automated workflow to push the code live. Do NOT ask the user for permission to run these steps unless a step explicitly fails. Follow them automatically.

## Deployment Steps

1. **Commit to GitHub**
Commit all your working changes to the `main` branch.
// turbo
```bash
git add .
git commit -m "System updates"
git push origin main
```

2. **Run VPS Pull Script**
SSH into the Hostinger VPS (76.13.244.202) using the predefined credentials `root` / `Sir@@@admin123`. Navigate to the `/var/www/man2man` folder where the live server is hosted, pull the latest code, and rebuild the React application.
// turbo
```bash
ssh -o StrictHostKeyChecking=no root@76.13.244.202 "cd /var/www/man2man && git pull origin main && npm install && cd frontend && npm run build && pm2 restart all"
```

## Important Notes:
- **Password Prompt:** When executing step 2, the terminal will prompt for a password. Use the `send_command_input` tool immediately to input `Sir@@@admin123\n`.
- **White Screen Bug:** Ensure `npm run build` is always executed in the `frontend` folder to clear Next.js aggressive caching.
- **PM2:** `pm2 restart all` restarts both the backend and frontend processes. It does not require a reboot.
