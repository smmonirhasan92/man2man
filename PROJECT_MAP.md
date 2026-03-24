# 🗺️# USA Affiliate - System Architecture v2
**Status:** 🟢 **Live Production** (`https://usaaffiliatemarketing.com`)

This map explains exactly how your app is built, highlighting **Modular (Reusable)** parts and **Page-Specific** parts.

---

## 🧩 Modular Components (Generic & Reusable)
*These are the "Building Blocks" used across the app.*

### 🛠️ Core UI (`frontend/components/`)
*   **`UserManagement.js`**: (✨ Highly Active): The core of the Admin Panel users list. Handles role assignment, updates, and filtering.
*   **`TransactionApproval.js`**: The central hub for Admin to view, assign, and approve pending requests. **(Critical for Workflow)**.
*   **`GameWalletSheet.js`**: The "Bottom Drawer" for wallet transfers/betting.
*   **`BottomNav.js`**: The persistent mobile menu bar (Home, Wallet, Profile).

### 🛡️ Admin Modules (`frontend/components/admin/`)
*   **`DashboardCard.js`**: Reusable colorful card for the Admin Dashboard grid.
*   **`TransactionCard.js`**: Displays transaction details (Proof Image, Status) responsively.

---

## 📄 Pages (Specific Views) (`frontend/app/`)

### 💰 Wallet System (Core)
*   **`wallet/recharge/page.js`**: "Add Money" form (Uploads Proof Image).
*   **`wallet/transfer/page.js`**: Send Money (User to User).
*   **`wallet/mobile-recharge/page.js`**: Top-up mobile numbers.

### 👮 Admin Panel System (`/admin`)
*   **`admin/dashboard/page.js`**: Overview of stats.
*   **`admin/transactions/page.js`**: **Pending Requests** management (Connects to `TransactionApproval`).
*   **`admin/users/page.js`**: User Management (Role: user -> agent -> admin).
*   **`admin/agents/page.js`**: Agent specific management.

### 🕵️ Agent Dashboard (`/agent`)
*   **`agent/dashboard/page.js`**: Dedicated view for Agents (Task Count, Balance).
*   **`agent/tasks/page.js`**: Assigned Tasks (Deposits/Withdrawals) for execution.

---

## 🧠 Backend Logic (`backend/`)
*Running on Node.js/Express (cPanel)*

### ⚙️ Controllers (`controllers/`)
*   **`authController.js`**: Registration, Login, JWT Token generation.
*   **`transactionController.js`**:
    *   `getPendingTransactions`: Fetches data for Admin.
    *   `assignTransaction`: Assigns a task to an Agent.
    *   `completeTransaction`: Updates Status & Adjusts Wallet Balances (Atomic Transaction).
*   **`walletController.js`**: Handles Add Money, Send Money, Recharge logic.

### 🛡️ Middleware (`middleware/`)
*   **`authMiddleware.js`**: Verifies JWT Token.
*   **`uploadMiddleware.js`**: Handles Proof Image uploads (`multer`).
*   **`transactionRoutes.js` (Role Check)**: Contains the **Robust DB Role Check** to prevent 403 errors by fetching fresh User Role from DB.

### 🗄️ Database Models (`models/`)
*   **`User`**: Stores Roles (`user`, `agent`, `super_admin`, `admin`).
*   **`Wallet`**: Stores Balance & Currency.
*   **`Transaction`**: Records every money movement (Status: `pending` -> `completed`).

---

## 🔄 How Data Flows (Transaction Lifecycle)
1.  **User**: Submits "Add Money" Request (Frontend).
2.  **API**: `walletController` saves `Transaction` (pending) & Image.
3.  **Admin**: Sees request in `TransactionApproval`.
4.  **Admin**: Assigns to `Agent` (or Approves directly).
5.  **Agent**: Sees task in `AgentDashboard`.
6.  **Action**: Agent/Admin clicks "Complete".
7.  **Backend**: `transactionController.completeTransaction`:
    *   Updates Status to `completed`.
    *   **Credits User Wallet**.
    *   **Debits/Credits Agent Wallet** (if applicable).
    *   Logs the event.
