# Man2Man Architecture Blueprint (The Project Memory)

This document is the "Source of Truth" for the Man2Man gamification engine. Any future developer or AI agent MUST follow these logic pillars to maintain the platform's stability and P2P integrity.

---

## 1. The P2P Universal Matchmaker (Core Logic)
The P2P system is designed to redistribute funds among active players rather than playing against the house.

### **Pillars:**
- **Redis Pulse Processing:** Matches are processed in batches every **1 second** (`DEFAULT_WINDOW_MS`) to ensure a "Zero-Lag" feeling while maintaining batch integrity.
- **Global Liquidity Sync:** All games (Spin, Scratch, Gift) feed into a **Universal Live Pot** in Redis (`livedata:game:match_pot`). This ensures that even if one game is quiet, players in other games activate the "Bati" (Green Light).
- **The 6-Minute Cycle:** 
  - **Phase A (0-3 mins):** Win/Redistribution mode (High multipliers allowed).
  - **Phase B (3-6 mins):** Recovery/Stability mode (Conservative multipliers).
- **Target Seed Management:** The engine aims for a `TARGET_SEED` (e.g., 17,500 NXS). If the pool is below this, it enters a "Self-Preservation" mode.

---

## 2. Animation & UX Standards (The "High-End" Feel)
To prevent the app from feeling "toy-like," strict visual rules must be followed:

### **Rules:**
- **Golden Timing:** 
  - **Spin Wheels:** Exactly **1.2s** duration. Must include a **Recoil Launch** (starts by rotating slightly backward) and a **Heavy Deceleration** (`cubic-bezier(0.19, 1, 0.22, 1)`).
  - **Gift Boxes:** **1.5s** total duration. Includes a high-frequency **Impact Shake** for 150ms before opening.
- **Micro-Interactions:** 
  - Winning slices MUST pulse with a **Golden Glow**.
  - High-speed movement MUST have a subtle **Motion Blur** filter.
- **Seamless Loops:** Use the "Instant Replay" pattern. Never force a user to exit a modal just to play again. Use "Open Another" or "Spin Again" buttons.

---

## 3. Financial Integrity & Data Safety
- **Optimistic UI with Locks:** Always deduct balance from the UI immediately (Optimistic), but keep a `window.isLuckTestAnimating` lock.
- **Deferred Socket Updates:** If a socket balance update arrives while an animation is playing, **Defer It**. Apply it only after the animation finishes to prevent skipping or double-counting.
- **Transaction Wrapper:** All financial changes MUST use the `TransactionHelper` to ensure atomic operations (MongoDB session management).

---

## 4. UI Style Guide (Glassmorphism)
- **Backgrounds:** `#0f172a` (Deep Slate) with `backdrop-blur-xl`.
- **Accents:** 
  - Primary: Golden/Amber (`#FFD700`, `#FCD34D`).
  - Positive: Emerald (`#10b981`).
  - Danger: Rose/Pink (`#E11D48`).
- **Cards:** Rounded `3xl` (24px) or higher. Borders are `border-white/5` or `border-white/10`.

---

> [!IMPORTANT]
> **Dev Rule:** Never lower the animation duration below 1.0s or raise it above 2.0s. Never introduce "House Edge" to P2P batches. Keep the redistribution pure.
