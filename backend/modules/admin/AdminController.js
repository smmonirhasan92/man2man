const SystemSetting = require('../settings/SystemSettingModel');
const AdminStatsService = require('./AdminStatsService'); // Reuse if needed
const Logger = require('../../common/Logger');

class AdminController {

    /**
     * Update System Setting & Broadcast via Socket
     * Endpoint: PUT /api/admin/settings/:key
     */
    async updateSetting(req, res) {
        try {
            const { key } = req.params;
            const { value, category } = req.body;
            const adminUser = req.user; // From Auth Middleware

            // 1. Audit / Permission Check
            if (!['super_admin', 'admin'].includes(adminUser.role)) {
                return res.status(403).json({ message: "Inaccessible" });
            }

            // 2. Update DB
            const setting = await SystemSetting.findOneAndUpdate(
                { key },
                { value, category, updatedBy: adminUser._id },
                { new: true, upsert: true }
            );

            // 3. CENTRALIZED COMMAND: Emit Real-time Update
            // "Ensure ... changes reflect INSTANTLY"
            if (req.io) {
                req.io.emit('config:update', { key: setting.key, value: setting.value });
                Logger.info(`[ADMIN] Setting ${key} updated to ${value} -> Broadcasted 📡`);
            } else {
                Logger.warn(`[ADMIN] Setting ${key} updated, but Socket.io not found on req`);
            }

            return res.json({ success: true, setting });
        } catch (err) {
            Logger.error("Failed to update setting", err);
            return res.status(500).json({ message: err.message });
        }
    }

    /**
     * Get Sync Status (Integration Check)
     */
    async getSystemHealth(req, res) {
        // ... (existing logic or new)
        return res.json({ status: 'active', socket: !!req.io });
    }

    /**
     * Get Debug Logs
     */
    async getSystemLogs(req, res) {
        try {
            const SystemLog = require('../../modules/common/SystemLogModel');
            const { limit = 100, level } = req.query;
            const query = level ? { level } : {};

            const logs = await SystemLog.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit));

            return res.json({ success: true, logs });
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    }
}

module.exports = new AdminController();
