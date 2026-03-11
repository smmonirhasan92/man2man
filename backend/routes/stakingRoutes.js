const express = require('express');
const router = express.Router();
const StakingController = require('../modules/staking/StakingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public/Available to all logged in users
router.get('/pools', authMiddleware, StakingController.getPools);
router.get('/my-stakes', authMiddleware, StakingController.getMyStakes);

// Actions
router.post('/stake', authMiddleware, StakingController.stake);
router.post('/claim/:id', authMiddleware, StakingController.claim);
router.post('/withdraw-early/:id', authMiddleware, StakingController.earlyWithdraw);

module.exports = router;
