const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const giftBoxController = require('../modules/gamification/GiftBoxController');
const authMiddleware = require('../middleware/authMiddleware');

// Route for Luck Test (Tiered Spins)
router.post('/luck-test', authMiddleware, spinController.spinLuckTest);

// [NEW] Mystery Gift Box Routes
router.post('/open-gift', authMiddleware, giftBoxController.openGiftBox);

module.exports = router;
