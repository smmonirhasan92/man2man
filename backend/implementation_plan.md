# Implementation Plan - Fix TaskCenter & Verification UX

## Goal
Fix "Duplicate Key" React errors and improve the User Experience (UX) by persisting "USA Server Verification" so users only do it once per day.

## Proposed Changes

### Frontend
#### [TaskCenter.js](file:///d:/man2man/frontend/components/dashboard/TaskCenter.js)
- **Fix Duplicate Key**: Delete the initial `useEffect` (lines 37-47) that fetches raw tasks without `gridId`. This conflicts with the main grid generator `useEffect`.
- **Persist Verification**:
    - **Load**: On mount, check `localStorage.getItem('usa_verified_date')`. If it matches today's date (`new Date().toDateString()`), set `verifiedSession(true)` automatically.
    - **Save**: In `verifyAndStart`, save `localStorage.setItem('usa_verified_date', new Date().toDateString())` upon success.

## Verification Plan
### Manual Verification
1.  **Reload Page**: Refresh `http://localhost:3000/tasks`.
2.  **Check Console**: Verify no red "Encountered two children with the same key" error appears.
3.  **Check UX**:
    - Enter key `+1 ...` (copy from dashboard).
    - Verify successfully.
    - **Reload Page again**.
    - Verify that the "Security Check" modal **does not** appear again (because it's saved).
