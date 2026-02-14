const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const agentController = require('../controllers/agentController');
const userController = require('../controllers/userController');
// const gameController = require('../controllers/gameController');
// const settingsController = require('../controllers/settingsController');

const User = require('../modules/user/UserModel');

// Middleware to check Admin Role
// Middleware to check Admin Role

const adminCheck = async (req, res, next) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const allowedRoles = ['admin', 'super_admin', 'employee_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        // Refresh role in request object for downstream controllers
        req.user.user.role = user.role;
        next();
    } catch (err) {
        console.error("Admin Check Middleware Error:", err);
        res.status(500).json({ message: 'Server Error during Auth Check', error: err.toString() });
    }
};

// [LIVE VAULTS]
router.get('/live-vaults', authMiddleware, adminCheck, (req, res) => {
    // Mock Response to prevent 404 on Dashboard
    res.json({ vaults: [], lastUpdate: new Date() });
});

// router.get('/recharges', authMiddleware, adminCheck, adminController.getPendingRecharges);
// router.post('/manage-transaction', authMiddleware, adminCheck, adminController.manageTransaction);
// router.get('/logs', authMiddleware, adminCheck, adminController.getAuditLogs);

// Redirect Legacy Financial Audit to New Stats
router.get('/audit/financial', authMiddleware, adminCheck, adminController.getFinancialStats);

// router.post('/deposit-request', authMiddleware, adminCheck, adminController.handleDepositRequest);
// router.post('/game-status', authMiddleware, adminCheck, adminController.updateGameStatus);

// Global Settings
// router.get('/settings/global', authMiddleware, adminCheck, adminController.getGlobalSettings);
// router.post('/settings/global', authMiddleware, adminCheck, adminController.updateGlobalSettings);

// System Settings (Maintenance, etc)
// router.get('/settings/system', authMiddleware, adminCheck, adminController.getSystemSettings);
// router.post('/settings/system', authMiddleware, adminCheck, adminController.updateSystemSettings);
router.get('/settings/public', (req, res) => res.json({ message: "Settings Public Placeholder" }));
// adminController.getPublicSettings

// System Health & Logs
router.get('/health', authMiddleware, adminController.getSystemHealth);
const adminModuleController = require('../modules/admin/AdminController');
router.get('/logs', authMiddleware, adminCheck, adminModuleController.getSystemLogs); // [NEW] Log Viewer

// Migrated Routes
router.post('/agent', authMiddleware, adminCheck, agentController.createAgent);
router.get('/agents', authMiddleware, adminCheck, agentController.getAgents);
router.put('/agent/commission', authMiddleware, adminCheck, agentController.updateAgentCommission);
router.post('/agent/balance', authMiddleware, adminCheck, agentController.adjustBalance);

router.get('/users', authMiddleware, adminCheck, userController.getAllUsers);
router.put('/user/role', authMiddleware, adminCheck, userController.updateUserRole);
router.post('/user/verify-agent', authMiddleware, adminCheck, agentController.verifyAgent);
router.put('/user/reset-password', authMiddleware, adminCheck, userController.adminResetPassword);

// Unmigrated / Disabled Routes
// router.get('/user/:userId/game-stats', authMiddleware, adminCheck, gameController.getUserGameStats);
// router.get('/game-logs', authMiddleware, adminCheck, gameController.getGameLogs);
// router.get('/deposit-settings', authMiddleware, adminCheck, gameController.getDepositSettings);
// router.post('/deposit-settings', authMiddleware, adminCheck, gameController.updateDepositSettings);

// User Management (Admin)
// router.get('/user/:id', authMiddleware, adminCheck, adminController.getUserDetails);
// router.patch('/user/:id/status', authMiddleware, adminCheck, adminController.updateUserStatus);
// router.patch('/user/:id/whitelist', authMiddleware, adminCheck, adminController.toggleUserWhitelist);
router.post('/user/:id/balance', authMiddleware, adminCheck, adminController.updateUserBalance);
// router.get('/user/:id/plans', authMiddleware, adminCheck, adminController.getUserPlans);

// Referral Stats
// router.get('/stats/referrals', authMiddleware, adminCheck, adminController.getReferralStats);
// router.get('/user/:id/referrals-tree', authMiddleware, adminCheck, adminController.getUserReferralTree);


// Account Plans / Tiers
const Plan = require('../modules/admin/PlanModel');
router.get('/tiers', authMiddleware, adminCheck, async (req, res) => {
    try {
        const plans = await Plan.find().sort({ price_usd: 1 });
        res.json(plans);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
// router.post('/tiers', authMiddleware, adminCheck, adminController.updateAccountTier);
// router.delete('/tiers/:id', authMiddleware, adminCheck, adminController.deleteAccountTier);

// Task Ads
// Task Ads
const taskAdController = require('../modules/task/TaskAdController');
router.get('/task-ad', authMiddleware, adminCheck, taskAdController.getTaskAds);
router.post('/task-ad', authMiddleware, adminCheck, taskAdController.createTaskAd);
router.put('/task-ad/:id', authMiddleware, adminCheck, taskAdController.updateTaskAd);
router.delete('/task-ad/:id', authMiddleware, adminCheck, taskAdController.deleteTaskAd);

// Mint and Stats routes
router.post('/mint', authMiddleware, adminCheck, adminController.mintUSC);
router.get('/stats/financial', authMiddleware, adminCheck, adminController.getFinancialStats);

// Debug Notification Trigger
router.post('/test-notify', authMiddleware, adminCheck, async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        const NotificationService = require('../modules/notification/NotificationService');
        // If 'ALL' or undefined, send to self
        const targetId = (userId === 'ALL' || !userId) ? req.user.user.id : userId;
        await NotificationService.send(targetId, message, type || 'info');
        res.json({ success: true, message: `Notification sent to ${targetId}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// START LOTTERY ADMIN
// Removed Lottery Routes
// END LOTTERY ADMIN

// --- Teen Patti Routes ---
// Removed Teen Patti Routes

// --- Admin Analytics & War Room ---
const analyticsController = require('../controllers/analyticsController');
router.get('/admin/stats', authMiddleware, analyticsController.getFinancialStats); // Secure later with role check
router.get('/admin/locked-users', authMiddleware, analyticsController.getLockedUsers);
router.get('/admin/settings', authMiddleware, analyticsController.getWarRoomSettings);
router.post('/admin/settings', authMiddleware, analyticsController.updateWarRoomSettings);

module.exports = router;
