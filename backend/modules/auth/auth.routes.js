const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.get('/usa-key', authMiddleware, authController.getDynamicKey);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/set-pin', authMiddleware, authController.setTransactionPin);
router.post('/change-pin', authMiddleware, authController.changeTransactionPin);

// --- OTP & Email Verification Routes ---
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/verify-otp', authLimiter, authController.verifyOtp);

// --- Forgot Password ---
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// --- Legacy User Migration & Email Binding ---
router.post('/bind-email', authMiddleware, authController.bindEmail);
router.post('/verify-legacy-email', authMiddleware, authController.verifyLegacyEmail);

module.exports = router;
