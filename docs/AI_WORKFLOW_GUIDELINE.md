# USA Affiliate Network - AI Workflow Guideline (Architect Mode)

## 1. Mandatory Analysis Protocol
- **Dependency Mapping:** Before any edit, scan the file's imports and exports to identify ripple effects.
- **Impact Assessment:** Notify the USER of which modules will be affected by a change.
- **Architectural Integrity:** No messy logic; follow the established `backend/modules` structure.

## 2. Shadow Deployment Strategy (Direct VPS)
- **Environment:** Staging vs Production.
- **Staging Port:** 3011 (Accessible via IP/Domain:3011).
- **Production Port:** 80/443 (Live User Base).
- **Process:** Edit on Staging -> USER Approval -> Atomic Sync to Production.

## 3. GitHub Continuity
- **Sync Rule:** `git push` after every meaningful change or session end.
- **Commit Messages:** High-detail, professional, and versioned.

## 4. Multi-Tenant / SaaS Scalability
- **Abstraction:** Hardcoding is strictly forbidden.
- **Dynamic Configuration:** All branding, rates, and credentials must be driven by `.env` or `config/` files.
- **Resale Readiness:** The software must be "Plug-and-Play" for other brands.

## 5. Persistent State (Master Memory)
- **Logging:** Maintain `logs/AI_WORKFLOW_HISTORY.log`.
- **handoff:** Upon new login, read this guideline and the history log first.
