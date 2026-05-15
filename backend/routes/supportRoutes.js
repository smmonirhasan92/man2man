const express = require('express');
const router = express.router ? express.Router() : express.Router; // Safe router init
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const r = express.Router();

// User Routes
r.post('/send', authMiddleware, upload.single('image'), supportController.sendMessage);
r.get('/my-messages', authMiddleware, supportController.getUserMessages);

// Admin Routes
r.get('/all', authMiddleware, roleMiddleware(['super_admin', 'admin', 'employee_admin']), supportController.getAllMessages);
r.post('/admin/initiate', authMiddleware, roleMiddleware(['super_admin', 'admin', 'employee_admin']), supportController.adminInitiateTicket);

// Thread Routes (Dual-Use)
r.post('/reply', authMiddleware, upload.single('image'), supportController.replyToMessage);

module.exports = r;
