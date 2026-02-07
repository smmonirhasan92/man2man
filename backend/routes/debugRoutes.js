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

module.exports = router;
