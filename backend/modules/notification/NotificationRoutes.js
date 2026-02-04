const express = require('express');
const router = express.Router();
const controller = require('./NotificationController');
const auth = require('../../middleware/authMiddleware');

router.get('/', auth, controller.getMyNotifications);
router.post('/read-all', auth, controller.markAsRead);
router.post('/otp', auth, controller.sendTestOTP);

module.exports = router;
