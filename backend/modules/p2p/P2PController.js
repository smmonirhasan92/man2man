const P2PService = require('./P2PService');

class P2PController {

    // POST /api/p2p/sell
    async createSellOrder(req, res) {
        try {
            const { amount, paymentMethod, paymentDetails, rate } = req.body;
            const order = await P2PService.createSellOrder(req.user.user.id, amount, paymentMethod, paymentDetails, rate);
            res.json({ success: true, order });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // POST /api/p2p/sell/:id/cancel
    async cancelSellOrder(req, res) {
        try {
            const order = await P2PService.cancelOrder(req.user.user.id, req.params.id);
            res.json({ success: true, order });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // GET /api/p2p/market
    async getMarket(req, res) {
        try {
            const orders = await P2PService.getOpenOrders();
            res.json(orders);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

    // GET /api/p2p/admin/trades
    async getAdminTrades(req, res) {
        try {
            const trades = await P2PService.getAdminTrades();
            res.json(trades);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

    // GET /api/p2p/my-orders
    async getMyOrders(req, res) {
        try {
            const orders = await P2PService.getMyOrders(req.user.user.id);
            res.json(orders);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

    // GET /api/p2p/my-trades
    async getMyTrades(req, res) {
        try {
            const trades = await P2PService.getMyTrades(req.user.user.id);
            res.json(trades);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

    // POST /api/p2p/buy/:orderId
    async initiateTrade(req, res) {
        try {
            const { requestedAmount } = req.body; // New field for partial buying
            const trade = await P2PService.initiateTrade(req.user.user.id, req.params.orderId, requestedAmount);
            res.json({ success: true, trade });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // GET /api/p2p/trade/:id
    async getTradeDetails(req, res) {
        try {
            const trade = await P2PService.getTradeDetails(req.params.id);
            // Security: Only allow participants
            const userId = req.user.user.id;
            if (trade.sellerId._id.toString() !== userId && trade.buyerId._id.toString() !== userId) {
                return res.status(403).json({ message: "Access Denied" });
            }
            res.json(trade);
        } catch (e) {
            res.status(404).json({ message: "Trade not found" });
        }
    }

    // POST /api/p2p/trade/:id/pay
    async markPaid(req, res) {
        try {
            // Pass the entire body (proofUrl, txId, senderNumber)
            const trade = await P2PService.markPaid(req.user.user.id, req.params.id, req.body);
            res.json({ success: true, trade });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // POST /api/p2p/trade/:id/release
    async holdTrade(req, res) {
        try {
            const trade = await P2PService.holdTrade(req.params.id);
            res.json({ success: true, trade });
        } catch (e) {
            res.status(400).json({ success: false, message: e.message });
        }
    }

    async confirmRelease(req, res) {
        try {
            const { pin } = req.body;
            const trade = await P2PService.confirmRelease(req.user.user.id, req.params.id, pin);
            res.json({ success: true, trade });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // POST /api/p2p/trade/:id/chat
    async sendChat(req, res) {
        try {
            const { text, imageUrl } = req.body;
            const msg = await P2PService.sendMessage(req.params.id, req.user.user.id, text, imageUrl);
            res.json({ success: true, msg });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // GET /api/p2p/trade/:id/chat
    async getChat(req, res) {
        try {
            const msgs = await P2PService.getMessages(req.params.id);
            res.json(msgs);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
    // POST /api/p2p/admin/resolve
    async resolveDispute(req, res) {
        try {
            const { tradeId, resolution } = req.body;
            // Admin Check Middleware should be applied on route
            const trade = await P2PService.resolveDispute(req.user.user.id, tradeId, resolution);
            res.json({ success: true, trade });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // POST /api/p2p/admin/approve
    async adminApprove(req, res) {
        try {
            const { tradeId, secKey1, secKey2, secKey3 } = req.body;

            // --- 3-LAYER SECURITY CHECK FOR SUPER ADMIN ---
            if (req.user.user.role === 'super_admin') {
                if (!secKey1 || !secKey2 || !secKey3) {
                    return res.status(403).json({ message: 'SECURITY ALERT: 3-Layer Verification Required to release funds. Keys missing.' });
                }

                // Validate against .env secrets or user-provided defaults
                const validKey1 = process.env.SUPER_ADMIN_SEC_KEY_1 || '1234';
                const validKey2 = process.env.SUPER_ADMIN_SEC_KEY_2 || '2314';
                const validKey3 = process.env.SUPER_ADMIN_SEC_KEY_3 || '3124';

                if (secKey1 !== validKey1 || secKey2 !== validKey2 || secKey3 !== validKey3) {
                    return res.status(403).json({ message: 'SECURITY ALERT: 3-Layer Verification Failed! Unauthorized access attempt.' });
                }
            }
            // --- END 3-LAYER SECURITY CHECK ---

            const trade = await P2PService.adminApproveRelease(req.user.user.id, tradeId);
            res.json({ success: true, trade });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
    // POST /api/p2p/trade/:id/rate
    async rateUser(req, res) {
        try {
            const { rating } = req.body;
            const result = await P2PService.rateTrade(req.user.user.id, req.params.id, rating);
            res.json(result);
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }
}

module.exports = new P2PController();
