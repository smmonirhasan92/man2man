# Task Restriction & Financial Logic Plan

## Goal 1: Restrict Tasks to Paid Plans
The user wants to prevent users on the 'Starter' (default/free) plan from performing tasks. They must upgrade to a paid plan.

### Proposed Changes
**Backend: `controllers/taskController.js`**
1.  **Modify `getTaskStatus`**:
    *   Add `canWork` boolean flag to the response.
    *   Set `canWork = false` if `user.account_tier === 'Starter'`.
    *   Add `message` to response: "Upgrade your plan to unlock tasks."
2.  **Modify `submitTask`**:
    *   Add strict check at the top:
        ```javascript
        if (user.account_tier === 'Starter' || user.account_tier === 'Free') {
             await t.rollback();
             return res.status(403).json({ message: 'Free plan cannot perform tasks. Please upgrade.' });
        }
        ```

**Frontend: `app/tasks/work/page.js`**
1.  Disable "Start Task" button if API returns `canWork: false`.
2.  Show a "Buy Plan" link/modal.

## Verification Plan
1.  **Manual Test (Task Restriction)**:
    *   Create a test script `test_task_restriction.js`.
    *   Login as a fresh user (Starter).
    *   Try `submitTask`.
    *   Expect error.
