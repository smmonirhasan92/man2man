const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const TaskHeartbeatController = require('../controllers/TaskHeartbeatController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireUSIdentity } = require('../middleware/requireUSIdentity');
const { taskClaimLimiter } = require('../middleware/rateLimiter');

// Generate Dynamic Key
router.post('/generate-key', authMiddleware, taskController.generateKey);

// [NEW] Seed Tasks (Public/Admin)
router.post('/seed', taskController.seedTasks);

// Get Task Status (Daily Progress)
// [SECURITY] Requires Active US Identity
router.get('/status', authMiddleware, requireUSIdentity, taskController.getTaskStatus);
router.post('/submit', authMiddleware, requireUSIdentity, taskClaimLimiter, taskController.submitTask); // Legacy
router.post('/process', authMiddleware, requireUSIdentity, taskClaimLimiter, taskController.processTask); // ULTRA-MODERN API
router.post('/claim', authMiddleware, taskClaimLimiter, taskController.claimTask); // [MODIFIED] Middleware removed, Controller handles Logic

// Get Available Tasks (Ads) - NEW
router.get('/', authMiddleware, taskController.getTasks);

// Start Task (Track Time)
router.post('/start', authMiddleware, taskController.startTask);

// [NEW] Verify Manual Connection
router.post('/verify-connection', authMiddleware, taskController.verifyConnection);

// [NEW] Task Heartbeat (Security)
router.post('/heartbeat', authMiddleware, TaskHeartbeatController.heartbeat);

router.post('/submit', authMiddleware, taskClaimLimiter, taskController.submitTask);

module.exports = router;
