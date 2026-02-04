const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.get('/usa-key', authMiddleware, authController.getDynamicKey);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
