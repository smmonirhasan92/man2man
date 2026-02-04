const express = require('express');
const router = express.Router();
const SettingsController = require('./SettingsController');

// Public routes
router.get('/public', SettingsController.getPublicSettings);

module.exports = router;
