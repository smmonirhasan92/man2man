const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/config-check', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const dbStatus = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbState] || 'Unknown';

        const envCheck = {
            PORT: process.env.PORT || 'Missing',
            MONGODB_URI: process.env.MONGODB_URI ? 'Set (Hidden)' : 'MISSING ❌',
            JWT_SECRET: process.env.JWT_SECRET ? 'Set (Hidden)' : 'MISSING ❌',
            CLIENT_URL: process.env.CLIENT_URL || 'Missing'
        };

        // Try a simple DB read
        let userCount = 'Error';
        try {
            userCount = await mongoose.connection.db.collection('users').countDocuments();
        } catch (e) {
            userCount = 'DB Read Failed: ' + e.message;
        }

        res.json({
            status: 'Debug Online',
            serverTime: new Date().toISOString(),
            database: dbStatus,
            userCount: userCount,
            env: envCheck
        });
    } catch (e) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

// [NEW] Fix Task Visibility (Align Server IDs)
router.post('/fix-tasks', async (req, res) => {
    try {
        const TaskAd = require('../modules/task/TaskAdModel');
        const Plan = require('../modules/admin/PlanModel');

        // 1. Find a valid plan to sync with (Starter/Basic)
        const plans = await Plan.find({ is_active: true });
        let targetId = 'SERVER_01'; // Default Fallback

        // Prefer 'Basic' or 'Starter' first, else take the first active one
        const starter = plans.find(p => /Starter|Basic|Free/i.test(p.name));
        if (starter && starter.server_id) {
            targetId = starter.server_id;
        } else if (plans.length > 0 && plans[0].server_id) {
            targetId = plans[0].server_id;
        }

        console.log(`[DEBUG] Fixing Tasks. Target Server ID: ${targetId}`);

        // 2. Update all tasks to this Server ID
        const result = await TaskAd.updateMany(
            {},
            { $set: { server_id: targetId, is_active: true } }
        );

        res.json({
            message: 'Task Visibility Fixed',
            targetServer: targetId,
            updatedCount: result.modifiedCount
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
