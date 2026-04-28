const express = require('express');
const router = express.Router();
const referralController = require('../modules/referral/ReferralController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, referralController.getDashboardData); // Reusing dashboard-data for stats
router.get('/list', authMiddleware, referralController.getNetworkMembers);
router.get('/network', authMiddleware, referralController.getNetworkMembers); // Added for UI compatibility
router.get('/logs', authMiddleware, referralController.getDashboardData); // Dashboard data includes logs
router.get('/dashboard-data', authMiddleware, referralController.getDashboardData);
router.get('/leaderboard', authMiddleware, referralController.getLeaderboard);

module.exports = router;
