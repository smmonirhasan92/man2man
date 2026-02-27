const express = require('express');
const router = express.Router();
const P2PController = require('../modules/p2p/P2PController');
const auth = require('../middleware/authMiddleware');

// Market
router.get('/market', auth, P2PController.getMarket);
router.get('/my-orders', auth, P2PController.getMyOrders);
router.get('/my-trades', auth, P2PController.getMyTrades); // [NEW] History

// Sell Flow
router.post('/sell', auth, P2PController.createSellOrder);
router.post('/sell/:id/cancel', auth, P2PController.cancelSellOrder);

// Buy Flow
router.post('/buy/:orderId', auth, P2PController.initiateTrade);

// Trade Actions
router.get('/trade/:id', auth, P2PController.getTradeDetails);
router.post('/trade/:id/pay', auth, P2PController.markPaid);
router.post('/trade/:id/release', auth, P2PController.confirmRelease);
router.post('/trade/:id/hold', auth, P2PController.holdTrade); // [SECURITY]
router.post('/trade/:id/cancel', auth, P2PController.cancelTrade); // [NEW] Refund Escrow
router.post('/trade/:id/chat', auth, P2PController.sendChat);

// Chat
router.get('/trade/:id/chat', auth, P2PController.getChat);

// Admin Actions
router.get('/admin/trades', auth, P2PController.getAdminTrades);
router.post('/admin/resolve', auth, P2PController.resolveDispute); // TODO: Add Admin Check Middleware
router.post('/admin/approve', auth, P2PController.adminApprove);

// Rating
router.post('/trade/:id/rate', auth, P2PController.rateUser);

module.exports = router;
