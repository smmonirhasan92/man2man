# Software Analysis & System Health Report
*Last Updated: 2026-01-16*

## 1. System Map (As-Is)
*Current architecture and entry points.*

### Runtime & Entry
- **Frontend**: Next.js App Router (`frontend/app/`). Runs on Port 3000.
    - Entry: `npm run dev`
    - Config: `.env.local`
- **Backend**: Express.js Server (`backend/server.js`). Runs on Port 5000.
    - Entry: `node server.js` (or `debug_server_start.bat`)
    - Config: `.env`, `SystemSetting` (DB)

### Key Modules (Business View)
| Module | Function | Frontend Path | Backend Controller | DB Model |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | Login/Register | `/login`, `/register` | `authController.js` | `User` |
| **Wallet** | Funds Management | `WalletCard.js` | `walletController.js` | `Wallet`, `Transaction` |
| **User Mgmt** | Admin User Control | `/admin/users` | `adminController.js` | `User` |
| **Referrals** | Tree & Bonus | `ReferralTree.js` | `userController.js` | `User` |
| **Agents** | Business Operators | `/agent` | `agentController.js` | `User (role: agent)` |
| **Tasks** | Ads & Rewards | `/tasks` | `taskController.js` | `TaskAd` |
| **Games** | Teen Patti/Fairness | `/game/teen-patti` | `gameController.js` | `Game`, `Round` |
| **Settings** | Global Rules | `/admin/settings` | `adminController.js` | `SystemSetting` |

---

## 2. Hidden Logic Status
*Analysis of schedulers, AI, and banking logic.*

| Feature | Status | Location / Note |
| :--- | :--- | :--- |
| **Banking Day / Settlement** | 🔴 **MISSING** | No daily reset concept found in code. System is event-based only. |
| **Offline AI** | 🔴 **MISSING** | `modules/ai` directory exists but is empty. No models found. |
| **Schedulers / Cron** | 🔴 **MISSING** | No `node-cron` or background workers. Limits (e.g. daily tasks) rely on Date comparisons in API calls. |
| **Referral Unlock** | 🟢 **ACTIVE** | `adminController.js` (Impl: Unlocks pending bonus on First Deposit approval). |
| **Wallet Reconciliation** | 🟡 **RISK** | Relies on transaction log sum; no separate ledger/reconciliation job found. |

---

## 3. High-Priority Risks
*Areas requiring immediate attention.*

1.  **No Scheduler**: Without a "Day Close" job, daily limits or banking days cannot be strictly enforced automatically.
2.  **Hardcoded Values**:
    - **API URL**: Hardcoded as `http://localhost:5000/api` in `frontend/services/api.js`. **Critical for Production.**
    - **Tier Prices**: Hardcoded in `userController.js` instead of being dynamic `SystemSetting`.
3.  **Game Stubs**: `aviatorController.js` and `minesController.js` appear to be incomplete placeholders.
4.  **Transaction Safety**: While `TransactionHelper` exists, we must ensure all monetary operations use it to prevent race conditions (negative balance bugs).

## 4. API Flow (Top Flows)
1.  **Login**: `POST /api/auth/login` -> `authController`
2.  **Deposit**: `POST /api/wallet/deposit` -> `walletController` -> **Admin Approval** -> `manageTransaction`
3.  **Referral View**: `GET /api/user/referrals` -> `userController.getMyReferrals` -> Tree Visualization
4.  **Admin User Search**: `GET /api/admin/users?search=...` -> `adminController.getAllUsers`

---

## 5. Next Steps (Recommended)
1.  **Implement Scheduler**: Add `node-cron` for "End of Day" processing.
2.  **Fix API URL**: Move base URL to `NEXT_PUBLIC_API_URL` env var.
3.  **Dynamic Pricing**: Move Tier Prices to DB `SystemSettings`.
4.  **Wallet Audit**: Run a script to verify `User.wallet` matches `Sum(Transactions)`.
