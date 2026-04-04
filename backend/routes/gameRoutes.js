const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const giftBoxController = require('../modules/gamification/GiftBoxController');
const authMiddleware = require('../middleware/authMiddleware');

const crashGameManager = require('../modules/gamification/CrashGameSocket');

const rateLimit = require('express-rate-limit');

// [P#5] Prevent rapid spinning (exploit prevention)
const spinLimiter = rateLimit({
  windowMs: 10 * 1000, 
  max: 2, 
  message: { success: false, message: 'Too many spins. Please wait 10s.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route for Luck Test (Tiered Spins)
router.post('/luck-test', authMiddleware, spinLimiter, spinController.spinLuckTest);

// Mystery Gift Box Routes
router.post('/open-gift', authMiddleware, giftBoxController.openGiftBox);

// Scratch Card Route
router.post('/scratch-card', authMiddleware, spinLimiter, spinController.scratchCard);

// --- UNIVERSAL MULTIPLIER API (CRASH GAME) ---

// 1. PLACE BET IN CURRENT LOBBY
router.post('/crash/bet', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await crashGameManager.placeBet(req.user.user.id, parseFloat(amount));
        res.json(result);
    } catch (err) {
        console.error("[CRASH BET ERROR]", err.message);
        res.status(400).json({ success: false, message: err.message });
    }
});

// 2. CASH OUT OF FLIGHT
router.post('/crash/cashout', authMiddleware, async (req, res) => {
    try {
        const result = await crashGameManager.cashOut(req.user.user.id);
        res.json(result);
    } catch (err) {
        console.error("[CRASH CASHOUT ERROR]", err.message);
        res.status(400).json({ success: false, message: err.message });
    }
});

// 3. GET SYNC STATE
router.get('/crash/state', (req, res) => {
    res.json({
        state: crashGameManager.state,
        currentMultiplier: crashGameManager.currentMultiplier,
        roundId: crashGameManager.roundId,
        players: crashGameManager.bets.size
    });
});

module.exports = router;
