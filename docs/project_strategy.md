# Man2Man Project Strategy & Guidelines

This document serves as the "Source of Truth" for development, deployment, and maintenance of the Man2Man project.

## 1. Docker Workflow (Local to VPS)
To ensure a smooth transition from local development to production, follow these rules:

- **Environment Consistency**: Always use `.env.production` for VPS settings. Never hardcode localhost IPs in backend logic.
- **Image Portability**: Use the provided `Dockerfile` patterns. They are optimized for size and security.
- **Deployment Command**: Use `bash scripts/deploy.sh` on the VPS to ensure zero-downtime updates.
- **Port Mapping**: Local uses 3000 (frontend) and 5050 (backend). Production typically uses Nginx to proxy these to port 80/443.

## 2. Code Cleanup & Reorganization
To fix the "AI-driven mess" and prevent future duplication:

- **Modular Approach**: All new features must reside in `backend/modules/[feature-name]`.
- **Single Source of Truth**: Common utilities (like database connections or logic helpers) must be moved to `backend/kernel` or `backend/utils`.
- **Periodic Audits**: After every major feature, a "Refactor Phase" will be initiated to remove dead code and redundant files.
- **No Root Clutter**: The root directory MUST remain minimal. Only `docker-compose`, `package.json`, and core config files are allowed.

## 3. Production Deployment Checklist
Before pushing to VPS, ensure:
1. [ ] `.dockerignore` excludes `node_modules` and local `.env`.
2. [ ] `docker-compose -f docker-compose.prod.yml build` succeeds locally.
3. [ ] All healthchecks in `Dockerfile` are passing.
4. [ ] Production Database URI is correctly set in the VPS environment.
5. [ ] Backup of current MongoDB is taken if schema changes are involved.

## 4. Scalability & Future Features (Games/P2P)
- **Architecture**: Move towards a strictly event-driven architecture for games using `Socket.io` and `Redis`.
- **Performance**: Implement caching for frequent database lookups (Users, Settings).
- **Cleanup**: Remove legacy/unused routes before adding new ones to reduce attack surface and memory usage.

## 5. Maintenance Guidelines
- **Logging**: Use the centralized `Logger` module. Avoid `console.log` in production code.
- **Automation**: Maintain the `scripts/` folder for all repetitive tasks (database cleanup, backup, logs rotation).
- **Documentation**: Every API change must be documented in [docs/](file:///d:/man2man_v2-VPS%20--%20Meror/docs).

---
*Created by Antigravity AI - 2026-04-01*
