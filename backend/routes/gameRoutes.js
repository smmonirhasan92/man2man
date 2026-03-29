const express = require('express');
const router = express.Router();
const spinController = require('../modules/gamification/SpinController');
const authMiddleware = require('../middleware/authMiddleware');

// Route for Luck Test (Tiered Spins)
router.post('/luck-test', authMiddleware, spinController.spinLuckTest);

module.exports = router;
