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

### P2P Staking & Micro-Investment System

This document outlines the architecture and implementation phases for the "Staking / Micro-Investment" feature, where users can lock their NXS for specific durations to earn a yield.

## Goal Description
Create a system where users are incentivized to hold/lock their NXS rather than immediately selling it on the P2P market. Users can choose different "Pools" (e.g., 7 days, 30 days) with different return rates. The longer they lock their funds, the higher the APY (Annual Percentage Yield) or profit margin.

## User Review Required
> [!IMPORTANT]
> **Key Decisions Needed from User:**
> 1. **Durations & ROI:** What should the default packages be? (e.g., 7 Days = 2% profit, 30 Days = 10% profit?)
> 2. **Early Withdrawal:** Can users withdraw their locked NXS before the time is up? If yes, should there be a penalty (e.g., losing all profit + 5% fee on principal)?
> 3. **Reward Distribution:** Does the reward get credited automatically when the time ends, or does the user need to click a "Claim" button?

## Proposed Changes

### Backend - Database Models
#### [NEW] `backend/modules/staking/StakingPoolModel.js`
- Schema to define available investment packages.
- Fields: `name` (e.g., "Silver Hold"), `durationDays` (e.g., 15), `rewardPercentage` (e.g., 5%), `minAmount` (e.g., 100 NXS), `isActive`.

#### [NEW] `backend/modules/staking/UserStakeModel.js`
- Schema to track individual user investments.
- Fields: `userId`, `poolId`, `stakedAmount`, `expectedReward`, `lockedAt`, `unlocksAt`, `status` ('ACTIVE', 'COMPLETED', 'CANCELLED').

### Backend - Business Logic
#### [MODIFY] `backend/modules/user/UserModel.js`
- Add a new field: `wallet.staked` (Default: 0) to track how much of a user's total balance is currently locked in staking.

#### [NEW] `backend/modules/staking/StakingService.js`
- Method: `getAvailablePools()`
- Method: `stakeNXS(userId, poolId, amount)` -> Deducts from `wallet.main`, adds to `wallet.staked`, creates `UserStake`.
- Method: `claimStake(userId, stakeId)` -> Validates time. If unlocked, returns principal + reward to `wallet.main`, deducts from `wallet.staked`. Log transactions.

#### [NEW] `backend/modules/staking/StakingController.js` & `backend/routes/stakingRoutes.js`
- API Endpoints to expose the StakingService methods to the frontend.

### Frontend - User Interface
#### [NEW] `frontend/app/dashboard/invest/page.js` (Or equivalent route)
- The main UI page for Micro-Investments.

#### [NEW] `frontend/components/staking/StakingDashboard.js`
- Displays active pools/cards where users can invest.
- Displays a user's active/completed stakes with a progress bar indicating time remaining.

#### [NEW] `frontend/components/staking/StakeModal.js`
- Modal to input the amount to stake, showing the live calculation of expected profit and unlock date.

## Verification Plan
### Automated & Manual Verification
- Test staking an amount and verifying `wallet.main` decreases and `wallet.staked` increases.
- Modify the database directly to simulate time passing (set `unlocksAt` to yesterday), then test the 'Claim' function to ensure principal and profit are correctly calculated and credited.
- Ensure users cannot stake more than their available `wallet.main` balance.
js` & `p2p.routes.js`.

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
