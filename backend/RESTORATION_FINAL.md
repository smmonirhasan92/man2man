# LOTTERY PAYMENT UPDATE

## [STATUS: ACTIVE - MAIN WALLET LINKED]

### 1. Payment Source
- **Changed From**: Game Wallet (`wallet.game`)
- **Changed To**: **Main Wallet** (`wallet.main`)
- **Reason**: Owner Directive. Lottery purchases are now direct/cash purchases.

### 2. Transaction Logging
- **Action**: Every ticket buy creates a `Transaction` record.
- **Type**: `LOTTERY_PURCHASE`
- **Visibility**: Users will see this in their Wallet History immediately.

### 3. Real-Time Sync
- **Socket**: Balance updates instanty upon purchase.

### Next Steps
- Verify visual balance deduction in Frontend when buying tickets.
