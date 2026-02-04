const express = require('express');
const router = express.Router();
const referralController = require('../modules/referral/ReferralController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, referralController.getStats);
router.get('/list', authMiddleware, referralController.getMyReferrals);
router.get('/logs', authMiddleware, referralController.getCommissionLog);
router.get('/dashboard-data', authMiddleware, referralController.getDashboardData);
router.get('/network-empire', authMiddleware, referralController.getNetworkEmpire);
router.get('/leaderboard', authMiddleware, referralController.getLeaderboard);
router.get('/tree', authMiddleware, referralController.getTree);

module.exports = router;
