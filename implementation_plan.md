# P2P Escrow System Implementation Plan

## Goal
Implement a professional Finance-grade P2P trading system where users can safely exchange funds. The system relies on `escrow_locked` wallet isolation and real-time Socket.io communication for matching and chat.

## User Review Required
> [!IMPORTANT]
> **Escrow Logic**: Funds are deducted from `main` and moved to `escrow_locked` **immediately** upon creating a Sell Order. They are only released (burned from escrow, credited to buyer) upon "Confirm Receipt".
>
> **Dispute Logic**: Admin has the power to "Release to Buyer" (Force) or "Refund to Seller" (Cancel) during a dispute.

## UI Design Proposal

### 1. P2P Trade Dashboard (User)
**Layout**: 2-Column Grid (Desktop) / Tabs (Mobile)
-   **Header**: "P2P Trading Floor" | Your Escrow Balance: [ $0.00 ] (Live)
-   **Tab A: "Cash Out" (Sell)**
    -   Input: Amount to Sell.
    -   Payment Mthod Selector: (bKash/Nagad/Rocket).
    -   Button: "Create Sell Order" (Triggers Escape to Escrow).
    -   *List below*: Your Active Orders (Waiting for Match).
-   **Tab B: "Cash In" (Buy)**
    -   List of available Sell Orders from other users.
    -   Each Item: User `Star***` | Amount | Method | Action: [ BUY ]
    -   Filter: By Amount Range.

### 2. Live Trade Room (The "Match" Box)
*Modal or Dedicated Page when a Match occurs*
-   **Left**: Order Details
    -   "Sending 500 BDT to User X"
    -   Countdown Timer (15:00) to complete payment.
    -   Payment Details (Phone Number hidden until Match).
-   **Right**: Real-Time Chat
    -   Chat Bubble UI (WhatsApp style).
    -   Input Area + [ Paperclip Icon ] for Proof Upload.
    -   Action Buttons:
        -   **Buyer**: [ I Have Paid ] (Disables timer, notifies Seller).
        -   **Seller**: [ Confirm Receipt ] (Releases Escrow).
        -   **Both**: [ Report Dispute ] (Summons Admin).

### 3. Admin Matching Panel
**Layout**: Split View
-   **Pool**: Unmatched Buy Requests vs Unmatched Sell Requests.
-   **Action**: Drag-and-drop or [ MATCH ] button to connect specific users manually.
-   **Live Disputes**: Red highlighted trades where "Report Dispute" was clicked.
    -   View Chat Logs.
    -   View Payment Proof.
    -   Decide: [ Release to Buyer ] or [ Refund Seller ].

---

## Proposed Changes

### Backend
#### [NEW] `backend/modules/p2p/`
-   `P2POrderModel.js`: Stores the trade listing (User, Amount, Status: OPEN/MATCHED/COMPLETED).
-   `P2PTradeModel.js`: Stores the active session between 2 users (ChatId, State).
-   `P2PMessageModel.js`: Chat history.
-   `P2PService.js`: Handles `createOrder`, `matchOrder`, `confirmPayment`, `releaseEscrow`.
-   `P2PController.js` & `p2p.routes.js`.

### Frontend
#### [NEW] `frontend/components/p2p/`
-   `P2PDashboard.js`: Main Listing UI.
-   `P2PChatRoom.js`: Socket Chat + Actions.
-   `OrderCreationModal.js`.

#### `frontend/components/admin/`
-   `AdminP2PManager.js`: The "God View" panel.

## Verification Plan
### Automated
-   `socket.test.js`: Simulate User A creating order, User B matching, Real-time event emission.
### Manual
-   User A (Incognito 1): Post Sell Order -> Check Balance (Escrow locked).
-   User B (Incognito 2): Click "Buy" -> Check Chat opens for both.
-   User B: Click "Paid".
-   User A: Click "Confirm".
-   Result: User A escrow 0, User B Main Balance +Amount.
