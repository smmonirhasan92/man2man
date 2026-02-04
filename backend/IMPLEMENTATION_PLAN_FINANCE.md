# Financial Reporting Refinement Plan

## Goal
The user indicated that `agent_recharge`, `bonuses`, and `commissions` are "creating money" (increasing system liability) and should likely be distinguished from direct User Deposits (`add_money`). We will update the Admin Dashboard metrics to reflect this distinction.

## Proposed Changes

### Backend: `controllers/adminController.js`

1.  **Modify `getSystemFinancials`**:
    *   **Metric 1: Real Deposits (Cash In)**
        *   Include: `add_money`, `recharge` (User-initiated).
        *   Exclude: `agent_recharge` (Moved to Created).
    
    *   **Metric 2: System Created Money (New Liability)**
        *   Include: `agent_recharge` (Admin→Agent), `signup_bonus`, `referral_bonus`, `commission`, `admin_credit`, `task_reward`.
        *   This tracks how much "new money" entered the system via Admin actions or System rules.

    *   **Metric 3: Cash Out** (Unchanged)
        *   Include: `withdraw`, `agent_withdraw`.

2.  **Update Response JSON Structure**:
    ```json
    overview: {
        today_cash_in: 1000,     // Real Deposits
        today_created: 50000,    // System Created (Liability Up)
        today_withdraws: 500,
        ...
    }
    ```

### Frontend: `app/admin/dashboard/page.js`

1.  **Update UI**:
    *   Replace "Today's Deposit" with "Avg/Total Created"? Or split it.
    *   The user focused on the classification. I will ensure the API delivers both metrics, then I can update the Dashboard to show: 
        *   Card 1: Today's Cash In (Real Money)
        *   Card 2: System Created (Virtual Money/Liabilities)

## Verification Plan

1.  **Manual Test**:
    *   Run `debug_fin.js` to fetch the new API response.
    *   Verify that `agent_recharge` (50,000) moves from `today_deposits` to `today_created`.
