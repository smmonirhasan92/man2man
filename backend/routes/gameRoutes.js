const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

// Services
const SuperAceServiceV2 = require('../modules/game/SuperAceServiceV2');

// --- SUPER ACE (V2 REBORN) ---
router.post('/super-ace/spin', protect, async (req, res) => {
    try {
        const { betAmount } = req.body;
        const userId = req.user.user.id;

        // [V2] Call Strict Service
        // Note: No 'systemIo' passed. Sockets are banned from this logic.
        const result = await SuperAceServiceV2.spin(userId, parseFloat(betAmount));
        res.json(result);

    } catch (err) {
        console.error("[SuperAceV2 Error]", err.message);
        const status = err.message.includes("Insufficient") ? 400 : 500;
        res.status(status).json({ message: err.message });
    }
});




// --- AVIATOR (CRASH) ROUTES ---
const AviatorService = require('../modules/game/AviatorService');

router.post('/aviator/bet', protect, async (req, res) => {
    try {
        const { betAmount } = req.body;
        const result = await AviatorService.placeBet(req.user.user.id, parseFloat(betAmount));
        res.json(result);
    } catch (err) {
        console.error("[Aviator Bet Error]", err.message);
        res.status(400).json({ message: err.message });
    }
});

router.post('/aviator/cashout', protect, async (req, res) => {
    try {
        const { betId, multiplier } = req.body;
        const result = await AviatorService.cashOut(req.user.user.id, betId, parseFloat(multiplier));
        res.json(result);
    } catch (err) {
        console.error("[Aviator Cashout Error]", err.message);
        res.status(400).json({ message: err.message });
    }
});

router.get('/aviator/state', async (req, res) => {
    try {
        const state = await AviatorService.getState();
        res.json(state);
    } catch (err) {
        console.error("[Aviator State Error]", err.message);
        res.status(500).json({ message: err.message });
    }
});

// --- LOTTERY ROUTES ---
const LotteryService = require('../modules/game/LotteryService');


// --- LOTTERY ROUTES (V2) ---

// [USER] Buy Ticket
router.post('/lottery/buy', protect, async (req, res) => {
    try {
        const { quantity } = req.body;
        const result = await LotteryService.buyTicket(req.user.user.id, parseInt(quantity));
        res.json(result);
    } catch (err) {
        console.error("[Lottery Buy Error]", err.message);
        res.status(400).json({ message: err.message });
    }
});

// [USER] Get Active Slot Status
router.get('/lottery/active', async (req, res) => {
    try {
        const status = await LotteryService.getActiveSlot();
        if (!status) return res.json({ status: 'INACTIVE', message: 'No Active Lottery' });
        res.json(status);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Alias for status
router.get('/lottery/status', async (req, res) => {
    try {
        const status = await LotteryService.getActiveSlot();
        if (!status) return res.json({ status: 'INACTIVE' });
        res.json(status);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [USER] Get My Tickets
router.get('/lottery/my-tickets', protect, async (req, res) => {
    try {
        const result = await LotteryService.getMyTickets(req.user.user.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [USER] Get History
router.get('/lottery/history', async (req, res) => {
    try {
        const history = await LotteryService.getHistory();
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [ADMIN] Create Slot
router.post('/lottery/admin/create', protect, async (req, res) => {
    // Check Admin Role? (Simplified for now, assume 'protect' + user check or just trust for this sprint)
    if (req.user.user.role !== 'admin' && req.user.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin Only' });
    }

    try {
        const { prize, multiplier } = req.body;
        const slot = await LotteryService.createSlot(parseInt(prize), parseInt(multiplier || 5));
        res.json(slot);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// [ADMIN] Force Draw
router.post('/lottery/admin/draw', protect, async (req, res) => {
    if (req.user.user.role !== 'admin' && req.user.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin Only' });
    }
    try {
        const result = await LotteryService.forceDraw();
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
