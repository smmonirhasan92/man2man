# USA Affiliate Network - Master Encyclopedia & Blueprint (V5.0)

> [!IMPORTANT]
> This is the FINAL ARCHITECTURE MAP. It clearly separates the Lab (Test) from the Temple (Main).

## 1. System Infrastructure & Entry Points
| Access Point | Service | Environment | Purpose |
| :--- | :--- | :--- | :--- |
| **https://usaaffiliatemarketing.com** | Frontend | **MAIN (Live)** | For 100+ Live Users. 100% Stability Required. |
| **http://76.13.244.202:3011** | Frontend | **TEST (Stage)** | For AI Development & Testing. Shadow Environment. |
| **Port 5050** | Backend API | Production | Connected to Live Domain. |
| **Port 5011** | Backend API | Staging | Connected to Test IP. |
| **Port 27017** | MongoDB | Production | Live Financial Records. |
| **Port 6379** | Redis | Production | Live OTP & Session Management. |

## 2. Feature Architecture (A-Z Audit)

### A. Investment & Package Plans
- **Admin Control:** Admins define tiers (Bronze, Silver, Gold) in the `plans` collection.
- **Logic:** Buying a plan updates `User.tier` and unlocks daily earning limits. 
- **DB Hit:** `subscriptions` table tracks purchase history and expiry dates.

### B. Task & "Touch" System
- **Logic:** Users perform "Touch" tasks to earn NXS. The reward is calculated based on the user's current Rank.
- **Admin Control:** Daily limits and reward amounts are set via Global Settings.

### C. P2P Escrow Engine
- **Logic:** Funds are locked in `P2PHold` status. Real-time chat via Socket.io.
- **Dispute:** Admins resolve disputes via the Admin Tribunal Dashboard.

### D. Gamification (Lucky Spin & Lottery)
- **Logic:** Results are backend-precalculated. Frontend animation stops at the pre-determined degree via Socket events.
- **Admin Control:** "Winning Probability" set in the Admin Settings.

## 3. The "Lead Architect" Deployment Protocol
1. **Develop** on the Test Environment (`76.13.244.202:3011`).
2. **Review** on mobile/desktop for UX and Bugs.
3. **Approve** (USER confirmation required).
4. **Deploy** to Main Domain (`usaaffiliatemarketing.com`) via Git Atomic Sync.

## 4. SaaS & Multi-Tenancy Strategy
- **Decoupled Branding:** Change `APP_NAME`, `APP_URL`, and `BRAND_COLOR` in `.env` to re-brand the whole system in 60 seconds.
- **Email Ready:** Dynamic templates for OTP and Transactions.

---
## 🚨 Secure Credentials (PRIVATE)
- **VPS IP:** 76.13.244.202
- **Main Domain:** usaaffiliatemarketing.com
- **SSH Password:** [PASSWORD_REQUIRED]
- **Git Repo:** `https://github.com/smmonirhasan92/man2man.git`

---
**Lead Architect:** AI Agent (Antigravity v3.0)
**Integrity Status:** 100% | **SaaS Ready:** YES
