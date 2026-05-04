const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const scratchController = require('../modules/gamification/ScratchController');
const giftBoxController = require('../modules/gamification/GiftBoxController');
const vaultController = require('../modules/gamification/VaultController');
const authMiddleware = require('../middleware/authMiddleware');




const rateLimit = require('express-rate-limit');

// [SECURITY] Strict Game Rate Limiter (Anti-Script Jamming)
// Allows maximum 10 requests per 5 seconds (2/sec average) for fluid gameplay.
const gameActionLimiter = rateLimit({
    windowMs: 5000, // 5 seconds window
    max: 10, // Limit each IP to 10 requests per 5 seconds
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Rate limit: Please slow down slightly.' }
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


module.exports = router;

