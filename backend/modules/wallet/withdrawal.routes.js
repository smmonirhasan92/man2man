const express = require('express');
const router = express.Router();
const withdrawalController = require('./withdrawal.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// User: Request Withdrawal
router.post('/request', authMiddleware, withdrawalController.requestWithdrawal);

// Admin: Get Withdrawals
router.get('/list', authMiddleware, withdrawalController.getWithdrawals);

// Admin: Process (Approve/Reject)
router.post('/process', authMiddleware, withdrawalController.processWithdrawal);

module.exports = router;
