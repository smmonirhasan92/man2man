# System Health & Architecture Analysis Report
**Date:** January 29, 2026
**Focus:** P2P Escrow Readiness & Lottery Logic Audit

## 1. 🚨 Critical Findings (Immediate Action Required)
> [!WARNING]
> **Lottery Schema Conflict**: The database models (`LotterySlotModel.js` and `LotteryTemplateModel.js`) have hardcoded `enum` restrictions for the `tier` field: `['FLASH', 'HOURLY', 'MEGA', 'INSTANT']`.
> 
> **Impact**: The new 10-tier scheduler (1M, 5M, 15M...) will **FAIL** to create new slots because `1M` is not in the allowed enum list. Mongoose validation will reject the save operations.
>
> **Fix Required**: Remove the `enum` restriction or update it to include all 10 new tiers in both models.

## 2. Wallet & Balance Architecture
### Current State
- **Main Balance**: Stored in `User.wallet.main`. This is the primary liquid balance.
- **Game Wallet**: `User.wallet.game` (winnings).
- **Locked Funds**: `User.wallet.game_locked` exists (used for turnover traps).
- **Security**: The "Manual Wallet" concept relies on `wallet.main`. Currently, there is no strictly isolated "Escrow" balance.

### P2P Escrow Recommendations
- **Storage**: Do **NOT** use `game_locked` for P2P. It risks conflict with game logic.
- **Proposal**: Add a new field `User.wallet.escrow_locked`.
- **Logic**:
  1.  Sender initiates P2P -> Move funds: `wallet.main` ⬇️ to `wallet.escrow_locked` ⬆️.
  2.  Receiver confirms -> Move funds: `Sender.wallet.escrow_locked` ⬇️ to `Receiver.wallet.main` ⬆️.
  3.  Dispute/Cancel -> Return: `Sender.wallet.escrow_locked` ⬇️ to `Sender.wallet.main` ⬆️.

## 3. Lottery Engine Status
- **Scheduler**: Logic in `LotteryService.js` is Dynamic (fetches active templates).
- **Templates**: All 10 tiers (1M - 7D) were attempted to be seeded.
- **Socket**: Port 5050 is **Active** and accepting connections (`verify_socket.js` passed).
- **Admin UI**: "Configure" buttons trigger API calls, but backend creation will fail due to the Schema Enum issue mentioned above.

## 4. Transaction Data Integrity
- **Logs**:
  - `lottery_buy`: Fully implemented.
  - `game_win`: Implemented with `tierName` and `ticketId`.
- **Payment Methods**:
  - **Missing**: There is no dedicated `paymentMethod` column in `TransactionModel`.
  - **Current**: Likely stored in `description` or `metadata`.
  - **Recommendation**: Valid for P2P? Yes, but for P2P we should store `bkash/nagad` details in `metadata: { provider: 'bkash', number: '...' }`.

## 5. P2P Feasibility Study
- **Match & Lock**: Feasible with the new `escrow_locked` field.
- **Dispute System**:
  - **Current User Model**: Lacks dispute-specific flags.
  - **Requirement**: Add `isDisputeActive` (Boolean) or `disputeCount` (Number) to `UserModel` to flag "High Risk" traders.
  - **Transaction Rel**: `TransactionModel` already has `relatedUserId` which is perfect for linking P2P buyers/sellers.

## Summary of Required Actions
1.  **FIX SCHEMAS**: Update `LotterySlotModel` and `LotteryTemplateModel` to allow all Tier strings (remove Enum).
2.  **DB MIGRATION**: Add `escrow_locked` to `User.wallet`.
3.  **UI UPDATE**: Ensure Admin Panel sends correct Tier IDs (1M, 5M...) which matched the seed.

*Analysis Completed by Agent Antigravity.*
