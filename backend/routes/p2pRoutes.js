const express = require('express');
const router = express.Router();
const P2PController = require('../modules/p2p/P2PController');
const auth = require('../middleware/authMiddleware');
const User = require('../modules/user/UserModel');

// Admin Check Middleware
const adminCheck = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.user.id);
        if (!user || !['admin', 'super_admin', 'employee_admin'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        next();
    } catch (e) {
        res.status(500).json({ message: 'Admin check failed.' });
    }
};

// Market
router.get('/market', auth, P2PController.getMarket);
router.get('/my-orders', auth, P2PController.getMyOrders);
router.get('/my-trades', auth, P2PController.getMyTrades); // [NEW] History
router.get('/summary', auth, P2PController.getSummary);    // [NEW] Stats

// Create Ad
router.post('/order', auth, P2PController.createOrder);
router.post('/order/:id/cancel', auth, P2PController.cancelSellOrder);

// Buy Flow
router.post('/buy/:orderId', auth, P2PController.initiateTrade);

// Trade Actions
router.get('/trade/:id', auth, P2PController.getTradeDetails);
router.post('/trade/:id/pay', auth, P2PController.markPaid);
router.post('/trade/:id/release', auth, P2PController.confirmRelease);
router.post('/trade/:id/dispute', auth, P2PController.disputeTrade); // [NEW] User Reporting System
router.post('/trade/:id/cancel', auth, P2PController.cancelTrade); // [NEW] Refund Escrow
router.post('/trade/:id/chat', auth, P2PController.sendChat);

// Chat
router.get('/trade/:id/chat', auth, P2PController.getChat);

// Admin Actions
router.get('/admin/trades', auth, adminCheck, P2PController.getAdminTrades);
router.post('/admin/resolve', auth, adminCheck, P2PController.resolveDispute);
router.post('/admin/approve', auth, adminCheck, P2PController.adminApprove);

// Rating
router.post('/trade/:id/rate', auth, P2PController.rateUser);

module.exports = router;
