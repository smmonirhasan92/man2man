const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const giftBoxController = require('../modules/gamification/GiftBoxController');
const authMiddleware = require('../middleware/authMiddleware');

const crashGameManager = require('../modules/gamification/CrashGameSocket');

const rateLimit = require('express-rate-limit');

// [P#5] Session-Based Rest Logic (5 Min Play, 3 Min Rest)
const userSessions = new Map();
const sessionRestLimiter = (req, res, next) => {
    const userId = req.user?.user?.id;
    if (!userId) return next();

    const now = Date.now();
    const sessionData = userSessions.get(userId);

    if (!sessionData) {
        userSessions.set(userId, { startTime: now });
        return next();
    }

    const timePlayed = now - sessionData.startTime;
    const FIVE_MIN = 5 * 60 * 1000;
    const EIGHT_MIN = 8 * 60 * 1000;

    if (timePlayed < FIVE_MIN) { // 5 mins unlimited play
        return next();
    } else if (timePlayed < EIGHT_MIN) { // 3 mins cooldown
        const cooldownRemaining = EIGHT_MIN - timePlayed;
        return res.status(429).json({ 
            success: false, 
            message: 'Take a breath! Next session starts in...', 
            cooldownRemaining 
        });
    } else { // Session resets
        userSessions.set(userId, { startTime: now });
        return next();
    }
};

// Route for Luck Test (Tiered Spins)
router.post('/luck-test', authMiddleware, sessionRestLimiter, spinController.spinLuckTest);

// Mystery Gift Box Routes
router.post('/open-gift', authMiddleware, giftBoxController.openGiftBox);

// Scratch Card Route
router.post('/scratch-card', authMiddleware, sessionRestLimiter, spinController.scratchCard);

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
