# 🧠 MAN2MAN MASTER AI MEMORY (PORTABLE ARCHITECT)

> **CRITICAL DIRECTIVE FOR AI AGENTS:** 
> You are reading the core memory of the **Man2Man (USA Affiliate)** platform. This file contains the complete "নাড়িভুঁড়ি" (internals) of the software. By reading this file, you are authorized to act as the Senior Architect. 

---

## 1. 🎙️ VOICE TYPING INTERPRETATION PROTOCOL (MANDATORY)
The User frequently uses Voice Typing, which may produce incorrect spellings or grammatically incoherent sentences in Bengali/English. 
**RULE 1:** BEFORE writing any code or making server changes, you MUST:
1. Analyze the user's prompt.
2. Match it with the system context below.
3. Output a clarification block: *"আপনি ভয়েস টাইপে যা বলেছেন, আমি এনালাইসিস করে বুঝেছি আপনি মূলত [X] করতে চাচ্ছেন। আমার বোঝা সঠিক হলে অনুমতি দিন, আমি কাজ শুরু করছি।"*
4. WAIT for the user to say "Yes/হ্যাঁ" before executing any destructive or structural changes.

---

## 2. 🚀 VPS-DIRECT-ONLY WORKFLOW (THE ONE TRUE PIPELINE)

> [!IMPORTANT]
> **লোকাল পিসিতে ডেভেলপমেন্ট সম্পূর্ণ নিষিদ্ধ।** Windows + Docker deployment cycle অনেক ঝামেলা তৈরি করে। সরাসরি VPS-এ কাজ করলে আউটপুট বেটার এবং পারফেক্ট হয়। এটি আমাদের চূড়ান্ত সিদ্ধান্ত।

### ✅ একমাত্র অনুমোদিত কাজের পদ্ধতি:
```
AI Agent → ssh_runner.js → VPS (/var/www/man2man) → docker rebuild
```

### নীতিমালা (Rules — Never Break These):

| নিয়ম | বিবরণ |
|---|---|
| **VPS-ONLY** | সমস্ত কোড পরিবর্তন সরাসরি `/var/www/man2man` ফোল্ডারে করতে হবে `ssh_runner.js` দিয়ে |
| **NO LOCAL DEV** | লোকাল D: ড্রাইভে কোনো কোড পরিবর্তন করা যাবে না — VPS কোডের সাথে sync নেই |
| **REBUILD AFTER CHANGE** | প্রতিটি পরিবর্তনের পর অবশ্যই Docker rebuild করতে হবে |
| **ONE FILE AT A TIME** | বড় পরিবর্তনের ক্ষেত্রে ফাইলওয়ারি কাজ করে প্রতিটি ধাপে confirm নিতে হবে |
| **BACKUP FIRST** | ক্রিটিক্যাল ফাইল পরিবর্তনের আগে `cp file.js file.js.bak` দিয়ে ব্যাকআপ নিতে হবে |
| **NO PM2** | কখনো `pm2 start` বা `npm run build` লোকালি চালাবে না — Docker সব handle করে |

### কাজের ধাপ (Step-by-Step VPS-Direct Workflow):

**ধাপ ১: ফাইল এডিট (VPS-এ সরাসরি)**
```bash
node scripts/ssh_runner.js "cat > /var/www/man2man/path/to/file.js << 'HEREDOC'\n[NEW CODE]\nHEREDOC"
```

**ধাপ ২: Docker Rebuild (Frontend/Backend আলাদাভাবে)**
```bash
# শুধু Backend পরিবর্তন হলে:
node scripts/ssh_runner.js "cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build backend"

# শুধু Frontend পরিবর্তন হলে:
node scripts/ssh_runner.js "cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend"

# উভয় পরিবর্তন হলে:
node scripts/ssh_runner.js "cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend backend"
```

**ধাপ ৩: ভেরিফিকেশন**
```bash
node scripts/ssh_runner.js "docker ps && docker logs m2m-backend --tail=20"
```

### VPS সার্ভার তথ্য:
- **Domain:** usaaffiliatemarketing.com
- **VPS IP:** 76.13.244.202
- **Project Path:** `/var/www/man2man`
- **Frontend Port:** 3000 (Next.js → Nginx → HTTPS)
- **Backend Port:** 5050 (Express → Nginx → HTTPS)
- **Network Mode:** Docker `host` mode
- **Live DB:** `universal_game_core_v1` @ `127.0.0.1:27017`
- **SSH Access:** `node scripts/ssh_runner.js "COMMAND"`

---

## 3. 🏗️ SYSTEM ARCHITECTURE & INTERNALS

### A. Cloudflare Edge Network (NEW)
- **Status:** ACTIVE (Proxy Enabled).
- **Real IP Tracking:** Nginx is configured to read `CF-Connecting-IP`. NEVER use standard `$remote_addr` in backend logs or rate-limiting without checking Cloudflare headers first.
- **Cache Management:** Cloudflare caches static assets (Next.js JS/CSS). If you deploy a frontend change and the user cannot see it, instruct them to clear their browser cache or temporarily enable "Development Mode" in the Cloudflare dashboard.

### B. Frontend (Next.js)
- **Directory:** `/var/www/man2man/frontend`
- **App Router:** `/app` (e.g., `/dashboard`, `/admin`, `/p2p`, `/marketplace`)
- **Components:** `/components` — Reusable UI. **No duplicate logic.**
- **State Management:** `useAuthContext.js` handles global user state. Socket listeners are centralized here.
- **PWA:** Handled by `web-push` and `next-pwa`.

### B. Backend (Node.js + Express + Socket.io)
- **Directory:** `/var/www/man2man/backend`
- **Wallet & Real-Time Sync:** Socket.io for sub-millisecond updates.
  - **Crucial Event:** `wallet_sync` emitted from `transaction.controller.js` directly to user socket room. **NEVER** use HTTP GET for wallet refreshes after transactions.
- **P2P Escrow Engine:** Core business logic for buying/selling NXS coins. High security required. **"Smart Ad Control"** enforced: Users can only have 1 active ad per payment method, and cannot create new ads if they have disputed/pending trades.
- **Gamification:** `SpinController.js`, `ScratchController.js`, `GiftBoxController.js` — all use atomic `$gte` balance checks. To ensure ultra-fast game loading and avoid DB bottlenecks, we utilize Redis for caching match pots and player statuses. Older game loops (Aviator, Mines, Teen Patti) **PERMANENTLY PURGED**.
- **Tasks:** Handled by `TaskTVPlayer` (`/tasks/ads`).

---

## 4. 💰 FINANCIAL BUSINESS LOGIC & BRANDING

1. **Currency Standard:** `1 USD = 100 NXS`. All calculations must respect this ratio. Use `frontend/utils/currency.js` for all formatting — **NEVER hardcode `$` for NXS values**.
2. **Atomic Operations:** All wallet balance changes MUST use `findOneAndUpdate` with `{ $gte: cost }` filter — never `findById` + `save()`. Race conditions are eliminated this way.
3. **3-Layer Admin Security:** Super admin deposit approvals require `SUPER_ADMIN_SEC_KEY_1/2/3` validation in `transaction.controller.js`.
4. **Branding:** The term **"Agent"** is deprecated in UI → now **"Merchant"** or **"Vendor"**. Backend routes still use 'agent' programmatically.
5. **Marketplace (VIP & Nodes):** `frontend/app/marketplace` handles VPS Nodes and VIP Membership Cards.
6. **Transaction Safety (Bonus Safeguard):** Never allow arbitrary `bonusAmount` additions without bounds checking. In `transaction.controller.js`, any `bonusAmount` applied during deposit approval MUST NOT exceed 200% of the base deposit to prevent astronomical balance inflations (e.g., accidentally pasting a phone number or timestamp).

---

## 5. 🛡️ AI DEVELOPMENT BEST PRACTICES

1. **Dead Code Policy:** Deprecated features (e.g., `ad-demo`, old `member` pages, `LoginForm.js`, `LotteryCard.js`, `ReferralTree.js`) — already purged. Never restore them.
2. **Socket over HTTP:** Use `SocketService.broadcast` or `systemIo.to().emit()` — never polling.
3. **Currency Display:** Always use `formatNXS()` from `frontend/utils/currency.js`. Never use raw `$` sign for NXS amounts in admin panels.
4. **Log Management:** Docker logs restricted to 10MB (max 3 files) via `docker-compose.prod.yml`. Run `docker system prune -af --volumes` after heavy updates.
5. **No Direct DB Edits:** Never drop collections or modify raw balances without using Transaction Controller APIs.

---

## 6. 🔄 DOCKER LOG ROTATION (PRODUCTION CONFIG)
```yaml
# docker-compose.prod.yml — already configured
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

**STATUS:** 🟢 VPS-Direct-Only Mode Active. All development happens on `/var/www/man2man` via `ssh_runner.js`.
