const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const scratchController = require('../modules/gamification/ScratchController');
const giftBoxController = require('../modules/gamification/GiftBoxController');
const vaultController = require('../modules/gamification/VaultController');
const authMiddleware = require('../middleware/authMiddleware');

const crashGameManager = require('../modules/gamification/CrashGameSocket');

const rateLimit = require('express-rate-limit');

// [SECURITY] Strict Game Rate Limiter (Anti-Script Jamming)
// Allows maximum 1 request per second per IP to prevent rapid-fire scam attacks.
const gameActionLimiter = rateLimit({
    windowMs: 1000, // 1 second window
    max: 1, // Limit each IP to 1 request per `window` (here, per second)
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Rate limit exceeded: Please wait a second before spinning again.' }
});

// [P2P MODEL] No session cooldown needed — users can play unlimited.
// The engine's own 6-minute Silent Pulse handles financial safety automatically.

// Public Vault Status (Max Safe Win Info)
router.get('/vault-status', authMiddleware, vaultController.getPublicVaultStatus);

// Route for Luck Test (Tiered Spins)
router.post('/luck-test', authMiddleware, gameActionLimiter, spinController.spinLuckTest);

// Mystery Gift Box Routes
router.post('/open-gift', authMiddleware, gameActionLimiter, giftBoxController.openGiftBox);

// Scratch Card Route
router.post('/scratch-card', authMiddleware, gameActionLimiter, scratchController.scratchCard);

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
