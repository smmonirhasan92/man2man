const express = require('express');
const router = express.Router();
const referralController = require('../modules/referral/ReferralController');
const authMiddleware = require('../middleware/authMiddleware');

// [PRIVATE] All routes require authentication
router.get('/stats', authMiddleware, referralController.getDashboardData);
router.get('/dashboard-data', authMiddleware, referralController.getDashboardData);
router.get('/network', authMiddleware, referralController.getNetworkMembers);
router.get('/list', authMiddleware, referralController.getNetworkMembers);
router.get('/logs', authMiddleware, referralController.getDashboardData);
router.get('/leaderboard', authMiddleware, referralController.getLeaderboard);
router.post('/claim', authMiddleware, referralController.claimCommission);
router.post('/claim-all', authMiddleware, referralController.claimAllCommissions);
router.get('/history', authMiddleware, referralController.getReferralHistory);

module.exports = router;
