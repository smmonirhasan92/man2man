# Man2Man Platform: Deployment & Security Blueprint (Memory File)

> [!IMPORTANT]
> **SACRED RULE:** Never deploy to the Main Domain (Production) without explicit user approval and successful verification on the Test VPS (Staging).

This document serves as the permanent memory for all AI agents and developers working on the Man2Man project. It defines the strict 3-tier environment hierarchy that must be followed to ensure platform stability and financial integrity.

---

## 🏗️ The 3-Tier Environment Hierarchy

### Tier 1: Local Development (Safety Zone)
- **Purpose:** Sandbox for active coding, UI tweaks, and logic debugging.
- **Access:** `http://localhost:3010` (Frontend) | `http://localhost:5050` (Backend)
- **Database:** Local MongoDB (Docker or Local Instance).
- **Modification Rule:** Safe to experiment freely.

### Tier 2: Test VPS / Staging (Validation Zone)
- **Host IP:** `76.13.244.202`
- **Frontend URL:** `http://76.13.244.202:3011`
- **Docker Config:** `docker-compose.test.yml`
- **Workflow:**
    1. Commit local changes to `main` branch.
    2. Run `/deploy-test` workflow.
    3. User verifies functionality, UI responsiveness, and stats accuracy here.
- **Modification Rule:** This is where internal "System Analysis" and agent activity auditing are tested before going live.

### Tier 3: Main Domain / Production (Live Zone)
- **Domain:** `usaaffiliatemarketing.com`
- **Docker Config:** `docker-compose.prod.yml`
- **Workflow:**
    1. **ONLY** proceed after Tier 2 verification is confirmed by the USER.
    2. Run `/deploy` workflow.
- **Modification Rule:** **CRITICAL DANGER.** No experimental patches or unverified financial logic should ever be pushed here directly.

---

## 🛡️ Operational Safeguards

1. **Rollback First:** If a production update causes unexpected issues (like stats dropping to zero or UI crashes), immediate `git revert` is the first priority.
2. **Counterparty Audit:** All P2P transactions must record `relatedUserId` to ensure complete transparency for the Admin.
3. **Data Integrity:** Whenever working with "Profit", "Cash In", or "Cash Out" logic, calculations must be verified against synthetic data in the Test Environment first.

---

## 🛠️ Essential Deployment Commands

- **Test Deploy:** `node scripts/ssh_runner.js "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.test.yml up -d --build"`
- **Production Deploy:** `node scripts/ssh_runner.js "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build"`

---
**Document Status:** ACTIVE & BINDING
**Last Updated:** 2026-04-11
