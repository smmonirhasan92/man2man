const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

// Services
const SuperAceService = require('../modules/game/SuperAceService');
const CoinFlipService = require('../modules/game/CoinFlipService'); // [NEW]

// --- COIN FLIP (STANDARD) ---
router.post('/play', protect, async (req, res) => {
    try {
        const { betAmount, choice } = req.body;
        const result = await CoinFlipService.play(req.user.user.id, parseFloat(betAmount), choice);
        res.json(result);
    } catch (err) {
        console.error("[CoinFlip Error]", err.message);
        const status = err.message.includes("Insufficient") ? 400 : 500;
        res.status(status).json({ message: err.message });
    }
});

// --- SUPER ACE (STANDARD) ---
router.post('/super-ace/spin', protect, async (req, res) => {
    try {
        const { betAmount } = req.body;
        const userId = req.user.user.id;

        // Call Standard Service
        const result = await SuperAceService.spin(userId, parseFloat(betAmount));
        res.json(result);

    } catch (err) {
        console.error("[SuperAceV2 Error]", err.message);
        const status = err.message.includes("Insufficient") ? 400 : 500;
        res.status(status).json({ message: err.message });
    }
});




// --- AVIATOR (CRASH) ROUTES ---
// --- AVIATOR ROUTES REMOVED ---

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
