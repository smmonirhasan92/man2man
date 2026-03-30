const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const giftBoxController = require('../modules/gamification/GiftBoxController');
const authMiddleware = require('../middleware/authMiddleware');

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

// [NEW] Mystery Gift Box Routes
router.post('/open-gift', authMiddleware, giftBoxController.openGiftBox);

module.exports = router;
