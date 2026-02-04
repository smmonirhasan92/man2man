const express = require('express');
console.log('DEBUG: transactionRoutes.js Loaded');
const User = require('../user/UserModel'); // Use Mongoose Model
const router = express.Router();
const transactionController = require('./transaction.controller');
const walletController = require('./wallet.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

// [CRITICAL FIX] Defensive Handler Wrapper
const safe = (fn, name) => {
    if (typeof fn === 'function') return fn;
    console.error(`[ROUTE ERROR] Handler ${name} is NOT a function. It is: ${typeof fn}`);
    return (req, res) => res.status(500).json({ message: `Server Error: Handler ${name} missing` });
};

router.post('/send', authMiddleware, safe(walletController.sendMoney, 'walletController.sendMoney'));
router.post('/mobile-recharge', authMiddleware, safe(walletController.mobileRecharge, 'walletController.mobileRecharge'));
router.get('/history', authMiddleware, safe(transactionController.getHistory, 'transactionController.getHistory'));

router.post('/add-money', authMiddleware, upload.single('proofImage'), safe(walletController.requestRecharge, 'walletController.requestRecharge'));

// Sys Settings
router.get('/settings/payment', safe(transactionController.getPaymentSettings, 'transactionController.getPaymentSettings'));
router.get('/test-settings', authMiddleware, safe(transactionController.getPaymentSettings, 'transactionController.getPaymentSettings'));

// Admin/Agent Routes (Inline middleware for simplicity or move to separate file later)
const checkRole = (roles) => async (req, res, next) => {
    try {
        // Fetch fresh user data from DB to ensure role is up-to-date
        const user = await User.findById(req.user.user.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update request user role with fresh DB role
        req.user.user.role = user.role;
        next();
    } catch (err) {
        console.error('Role Check Error:', err);
        return res.status(500).json({ message: 'Server Error' });
    }
};

router.get('/pending', authMiddleware, checkRole(['admin', 'super_admin', 'employee_admin']), safe(transactionController.getPendingTransactions, 'transactionController.getPendingTransactions'));
router.get('/all', authMiddleware, checkRole(['admin', 'super_admin']), safe(transactionController.getAllTransactions, 'transactionController.getAllTransactions'));
router.post('/assign', authMiddleware, checkRole(['admin', 'super_admin', 'employee_admin']), safe(transactionController.assignTransaction, 'transactionController.assignTransaction'));
router.get('/assigned', authMiddleware, checkRole(['agent', 'admin', 'super_admin']), safe(transactionController.getAssignedTransactions, 'transactionController.getAssignedTransactions'));
router.post('/complete', authMiddleware, checkRole(['agent', 'admin', 'super_admin']), safe(transactionController.completeTransaction, 'transactionController.completeTransaction'));

module.exports = router;
