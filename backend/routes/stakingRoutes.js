const express = require('express');
const router = express.Router();
const StakingController = require('../modules/staking/StakingController');
const { auth } = require('../middlewares/auth');

// Public/Available to all logged in users
router.get('/pools', auth, StakingController.getPools);
router.get('/my-stakes', auth, StakingController.getMyStakes);

// Actions
router.post('/stake', auth, StakingController.stake);
router.post('/claim/:id', auth, StakingController.claim);
router.post('/withdraw-early/:id', auth, StakingController.earlyWithdraw);

module.exports = router;
