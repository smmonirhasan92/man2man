const express = require('express');
const router = express.Router();
const SettingsController = require('./SettingsController');

const auth = require('../../middleware/authMiddleware');
const admin = require('../../middleware/adminMiddleware');

// Public routes
router.get('/public', SettingsController.getPublicSettings);

// Admin routes
router.post('/admin/update', auth, admin, SettingsController.updateSettings);

module.exports = router;
