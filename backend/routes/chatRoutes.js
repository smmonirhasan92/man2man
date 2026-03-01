const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');

// Rate limiting for the AI chat to prevent API abuse
const rateLimit = require('express-rate-limit');
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 messages per 15 minutes per IP
    message: { message: "Too many messages sent. Please wait and try again." }
});

router.post('/', chatLimiter, ChatController.handleChat);

module.exports = router;
