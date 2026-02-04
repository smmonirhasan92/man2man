const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const transactionController = require('../modules/wallet/transaction.controller');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../modules/user/UserModel');

// Middleware to check Agent Role
const agentCheck = async (req, res, next) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        if (user.role !== 'agent' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied. Agents only.' });
        }
        next();
    } catch (err) {
        console.error("Agent Check Middleware Error:", err);
        res.status(500).json({ message: 'Server Error during Auth Check' });
    }
};

router.get('/stats', authMiddleware, agentCheck, agentController.getSettlementStats);
router.post('/topup', authMiddleware, agentCheck, agentController.requestTopup);
router.post('/withdraw', authMiddleware, agentCheck, agentController.requestWithdraw);
router.get('/my-transactions', authMiddleware, agentCheck, transactionController.getAssignedTransactions);

module.exports = router;
