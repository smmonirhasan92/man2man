# 🚀 Antigravity Agent — Man2Man Master Memory

> [!IMPORTANT]
> **THIS FILE IS MANDATORY READING** for the Antigravity (Google DeepMind) agent at the start of EVERY conversation on this project.  
> Read this completely before writing a single line of code or running any command.

---

## 🧠 Agent Identity & Role

- **Agent Name:** Antigravity (Google DeepMind)
- **Project:** Man2Man (M2M) — P2P Gamification Platform
- **Repository:** `smmonirhasan92/man2man` (GitHub)
- **Local Workspace:** `D:\man2man_v2-VPS -- Meror\`
- **Role:** Lead engineering agent. Responsible for feature development, debugging, code review orchestration, and deployment pipeline management.
- **Sub-Agents Available (Claude Code):**
  - `code-reviewer` — Invoked after writing/modifying M2M code for P2P safety and UI/UX compliance checks.
  - `debugger` — Invoked on any error, Redis failure, or unexpected animation behavior.

---

## 🏗️ System Architecture (3-Tier Hierarchy — SACRED)

```
LOCAL PC (Windows Dev)
  └─ Frontend:  http://localhost:3010
  └─ Backend:   http://localhost:5050
  └─ MongoDB:   localhost:27017
  └─ Redis:     localhost:6379
        │
        │  git push → GitHub (smmonirhasan92/man2man, main branch)
        │
VPS SERVER (76.13.244.202)  ── /var/www/man2man ──
  ├─ TEST ENV  (docker-compose.test.yml)
  │   └─ Frontend:  76.13.244.202:3011
  │   └─ Backend:   76.13.244.202:5011
  │   └─ MongoDB:   27018 (Docker container)  DB: universal_game_core_docker
  │   └─ Redis:     6380  (Docker container)
  │
  └─ PROD ENV  (docker-compose.prod.yml)  network_mode: "host"
      └─ Frontend:  usaaffiliatemarketing.com  (Nginx → port 3000)
      └─ Backend:   usaaffiliatemarketing.com/api (Nginx → port 5050)
      └─ MongoDB:   127.0.0.1:27017 (LIVE Native)  DB: universal_game_core_v1
      └─ Redis:     127.0.0.1:6379  (LIVE Native)
```

---

## ⚖️ The Sacred Deployment Rules (NEVER BREAK)

1. **NEVER deploy to Production without explicit USER approval after Test VPS verification.**
2. **NEVER use `pm2`** — The Main Domain is 100% Docker since April 2026. PM2 causes duplicate Cron Jobs (lottery, tasks).
3. **NEVER overwrite `.env.prod`** with Test DB credentials.
4. **NEVER hardcode `MONGODB_URI`** in `docker-compose.prod.yml`.
5. **NEVER touch** `universal_game_core_v1` (Live DB) directly — always migrate through Test first.
6. **NEVER copy Test DB to Production.**
7. **If a production issue occurs → `git revert` is the FIRST action.** No hotfixes without revert safety net.

---

## 🚢 Deployment Commands

### /deploy-test (Tier 2 — Staging)
```bash
# Step 1: Push to GitHub
git add .
git commit -m "Auto-Deployment: Syncing local changes to Test Environment"
git push origin main

# Step 2: Rebuild Test Docker on VPS
node scripts/ssh_runner.js "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.test.yml down && docker compose -f docker-compose.test.yml up -d --build"
```
✅ Verify at: `http://76.13.244.202:3011`

### /deploy (Tier 3 — Production)
> Only after USER confirms Test VPS is verified.
```bash
# Step 1: Push to GitHub (if not already done)
git add .
git commit -m "System updates"
git push origin main

# Step 2: Rebuild Production Docker on VPS
node scripts/ssh_runner.js "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build frontend backend"
```
✅ Live at: `https://usaaffiliatemarketing.com`

### Database Migration (when schema/values change)
```bash
# Run against Test first, verify, then Live
docker exec m2m-backend node scripts/your_migration.js
```

---

## 🎨 UI/UX Compliance Standards (Code Review Checklist)

All code I write must pass these standards before deployment:

| Standard | Rule |
|---|---|
| **Glassmorphism** | Background: `#0f172a`, `backdrop-blur` applied on all panels |
| **Spin Animation** | Delay: exactly `1.2s`, recoil timing strictly followed |
| **6-Minute Game Cycle** | Do NOT break cycle timing with any async logic |
| **P2P Transactions** | ALL DB updates via `TransactionHelper` — no direct raw updates |
| **No Exposed Secrets** | Zero API keys/tokens in frontend or committed code |
| **Error Handling** | All async operations must have try/catch with proper error responses |
| **No Code Duplication** | DRY principle — extract reusable helpers |
| **Animation Integrity** | Degree-based rotation for spin wheel; CSS `cubic-bezier` for all animations |

---

## 🛡️ Financial & Game Logic Integrity

- **All P2P transactions** → use `TransactionHelper` for atomic DB writes.
- **All "Profit", "Cash In", "Cash Out" calculations** → must be verified against synthetic Test data first.
- **`relatedUserId`** must be recorded on ALL P2P transactions for Admin audit trail.
- **No house-edge hacks.** Fix underlying game logic correctly.
- **Redis 1-second pulse** → check for lag before assuming a logic bug.
- **Socket Spoiler Guard** → never send game result to client before animation completes.
- **Optimistic UI deduction** → deduct wallet on bet submission client-side, sync with backend result.

---

## 🐛 Debugging Protocol (When Issues Occur)

1. Capture the full error + stack trace.
2. Check `backend_logs.txt` and `m2m_log.txt` for socket/transaction failures.
3. Verify Redis 1-second pulse is not lagging.
4. Identify the failure layer: **Frontend → Backend → Redis → Nginx → MongoDB**.
5. Check recent `git diff` for the root cause.
6. Implement **minimal fix** — no sweeping changes during a live incident.
7. Test fix locally → deploy to Test → verify → deploy to Production.
8. Document the root cause and prevention recommendation.

---

## 🗂️ Key Files Reference

| File | Purpose |
|---|---|
| `docker-compose.test.yml` | Test VPS environment config |
| `docker-compose.prod.yml` | Production environment config (`network_mode: host`) |
| `frontend/Dockerfile` | Must contain `ENV PORT=3000` and `ENV HOSTNAME=0.0.0.0` |
| `backend/.env.prod` | Production secrets — NEVER overwrite |
| `scripts/ssh_runner.js` | VPS SSH command executor |
| `scripts/vps_uploader_v2.js` | VPS file uploader |
| `.agent/kb/deployment_blueprint.md` | Deployment & security blueprint |
| `.agent/workflows/deploy.md` | `/deploy` production workflow |
| `.agent/workflows/deploy-test.md` | `/deploy-test` staging workflow |
| `.claude/agents/code-reviewer.md` | Claude code-reviewer sub-agent definition |
| `.claude/agents/debugger.md` | Claude debugger sub-agent definition |

---

## ⚡ Quick Troubleshooting Reference

| Problem | Cause | Fix |
|---|---|---|
| Main Domain 404 | Frontend not binding | Ensure `HOSTNAME=0.0.0.0` in `frontend/Dockerfile`, rebuild |
| Cron Job runs twice | PM2 + Docker both running | `pm2 kill && pm2 save -f` |
| Test DB has live data | Wrong compose file | Always use `docker-compose.test.yml` for staging |
| Container name conflict | Zombie containers | `docker rm -f <container_name>` |
| Backend 5050 not responding | `.env.prod` missing | `cp backend/.env backend/.env.prod` |
| Redis pulse lagging | Overloaded event loop | Check for sync blocking code in the 1s pulse handler |

---

## 📋 Start-of-Conversation Checklist

Before any work session, confirm:
- [ ] Which tier am I working on? (Local / Test / Production)
- [ ] Has the USER confirmed Test VPS verification before any prod deploy?
- [ ] Are financial calculations being made? → Use Test DB first.
- [ ] Does this change affect the 6-minute game cycle? → Extra caution required.
- [ ] Will I need to run `code-reviewer` or `debugger` sub-agents after this change?

---

**Document Status:** ACTIVE & BINDING  
**Last Updated:** 2026-04-22  
**Maintained by:** Antigravity Agent (Google DeepMind)
