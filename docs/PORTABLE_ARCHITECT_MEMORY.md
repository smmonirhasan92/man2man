# USA Affiliate Network - Master Encyclopedia & Deployment Blueprint (V4.0)

> [!IMPORTANT]
> This is the ultimate "A to Z" technical reference for the platform. It covers Financials, Games, Admin Control, and SaaS Readiness.

## 1. System Infrastructure & Port Directory
| Port | Service | Purpose |
| :--- | :--- | :--- |
| **80/443** | Frontend (Prod) | Live User Interface (Next.js) |
| **5050** | Backend (Prod) | API, Socket.io, and Core Logic |
| **3011** | Frontend (Stage)| Shadow Testing / Staging Environment |
| **5011** | Backend (Stage) | Shadow API / Staging Backend |
| **27017** | MongoDB (Prod) | Financial & User Database |
| **6379** | Redis (Prod) | Session & OTP Cache |

## 2. Admin Control Center (The Brain)
The Admin Panel is located at `/admin` and is powered by `AdminController.js`.
- **Game Management:** Admins can adjust the "House Edge" for Lucky Spins. This is controlled via a `settings` collection in the DB.
- **User Auditing:** Admins can view every user's personal info, wallet balance, and trade history. If data is missing, check the `$lookup` aggregations in the `getUserProfile` method.
- **Manual Overrides:** Admins can manually approve deposits or release P2P funds if a user gets stuck.

## 3. Package & Subscription System (The Tier Logic)
The software uses a "Tier-Based" reward system:
- **Plan Definitions:** Defined in `backend/modules/plans`. Each plan (e.g., Bronze, Gold) has a `price` and `earning_multiplier`.
- **Purchase Logic:** Selection -> Balance Validation -> Subscription Record Created -> User `rank` field updated.
- **Automation:** Every 24 hours, the system checks for expired subscriptions and reverts users to the 'Free' tier.

## 4. User Profile Data Synchronization
If user info is missing on the profile page:
- **JWT Context:** Ensure the `authMiddleware` is correctly passing the `req.user.id`.
- **Aggregation Failure:** The profile page merges data from `Users`, `Wallets`, and `Packages`. If any of these are missing for a user, the whole profile might fail to load. 
- **Fix:** Use `Optional Chaining` in the frontend and `left outer join` (via `$lookup`) in the backend.

## 5. Lucky Spin & P2P Logic (Recap)
- **Lottery:** Backend calculates the result instantly; Frontend only displays the animation via Socket.io.
- **Escrow:** Seller's funds are locked until the Buyer marks as Paid and Seller confirms receipt.
- **Sounds:** Global `window.playSoundEffect` ensures alerts are heard even if the browser is throttled.

## 6. SaaS & Resale Deployment Guide
To sell this software:
1. Update `.env`: Change `APP_NAME`, `BRAND_COLOR`, and `DOMAIN`.
2. Assets: Change `/public` icons and logos.
3. The code is decoupled, so branding updates will reflect across all emails and UI components instantly.

## 7. Deployment & Maintenance Commands
- **Build Staging:** `docker compose -f docker-compose.test.yml up -d --build`
- **Build Production:** `docker compose -f docker-compose.prod.yml up -d --build`
- **Check Logs:** `docker logs m2m-backend --tail 50`

---
## 🚨 Private Access (FILL ON LOGIN)
- **IP:** [PASTE_IP]
- **Pass:** [PASTE_PASS]
- **GitHub:** `https://github.com/smmonirhasan92/man2man.git`

---
**Lead Architect:** AI Agent (Antigravity v3.0)
**Status:** Enterprise Grade | **Audit Date:** May 4, 2026
