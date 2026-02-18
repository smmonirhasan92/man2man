const SystemSetting = require('../settings/SystemSettingModel');
const AdminStatsService = require('./AdminStatsService'); // Reuse if needed
const Logger = require('../common/Logger');
const NotificationService = require('../notification/NotificationService');

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

    /**
     * Seed Safe-Patch V2 Plans (Production Trigger)
     * POST /api/admin/seed-plans-v2
     */
    async seedPlansV2(req, res) {
        try {
            const Plan = require('./PlanModel');
            const PLANS = [
                { price: 500, name: "Student Node" },
                { price: 1000, name: "Starter Node" },
                { price: 2000, name: "Basic Node" },
                { price: 3000, name: "Standard Node" },
                { price: 5000, name: "Advanced Node" },
                { price: 7000, name: "Pro Node" },
                { price: 9000, name: "Business Node" },
                { price: 10000, name: "Enterprise Node" },
                { price: 12000, name: "Corporate Node" },
                { price: 15000, name: "Tycoon Node" }
            ];

            const VALIDITY_DAYS = 35;
            const ROI_MULTIPLIER = 1.6; // 160%
            const DAILY_TASKS = 10;

            const results = [];

            for (let i = 0; i < PLANS.length; i++) {
                const p = PLANS[i];
                const planId = `PLAN_V2_${String(i + 1).padStart(2, '0')}`;

                // Calculate Math
                const totalReturn = p.price * ROI_MULTIPLIER;
                const dailyRevenue = totalReturn / VALIDITY_DAYS;
                const perTaskReward = dailyRevenue / DAILY_TASKS;

                const planData = {
                    name: `${p.name} (${p.price} BDT)`,
                    type: 'server',
                    unlock_price: p.price,
                    price_usd: (p.price / 120).toFixed(2), // Approx USD for display
                    validity_days: VALIDITY_DAYS,
                    daily_limit: DAILY_TASKS,
                    task_reward: parseFloat(perTaskReward.toFixed(4)), // PRE-CALCULATED PRECISION
                    roi_percentage: ROI_MULTIPLIER * 100,
                    server_id: `SERVER_${String(i + 1).padStart(2, '0')}`, // Unique Server Group per Plan
                    node_code: planId,
                    features: [
                        'Dedicated v2 Server',
                        `${DAILY_TASKS} Tasks Daily`,
                        `Total Return: ${totalReturn.toFixed(0)} BDT`,
                        '24/7 Support'
                    ],
                    is_active: true
                };

                const updatedPlan = await Plan.findOneAndUpdate(
                    { node_code: planId },
                    planData,
                    { upsert: true, new: true }
                );
                results.push(updatedPlan.name);

                // --- SEED TASKS FOR THIS SERVER GROUP ---
                const TaskAd = require('../task/TaskAdModel');
                const taskCount = await TaskAd.countDocuments({ server_id: updatedPlan.server_id });

                if (taskCount < 5) { // Only seed if empty or low
                    const tasksToSeed = [];
                    for (let t = 1; t <= 10; t++) {
                        tasksToSeed.push({
                            title: `Premium Ad View #${t} (${updatedPlan.name})`,
                            url: "https://google.com", // Placeholder
                            imageUrl: "https://via.placeholder.com/150",
                            duration: 10,
                            reward_amount: perTaskReward, // Display only, overridden by Plan Logic
                            server_id: updatedPlan.server_id,
                            type: 'ad_view',
                            is_active: true,
                            priority: 100 - t
                        });
                    }
                    await TaskAd.insertMany(tasksToSeed);
                    Logger.info(`[ADMIN] Seeded 10 Tasks for ${updatedPlan.server_id}`);
                }
            }

            Logger.info(`[ADMIN] Seeded ${results.length} V2 Plans + Tasks via API`);
            return res.json({ success: true, message: "Safe-Patch V2 Plans & Tasks Seeded Successfully", plans: results });

        } catch (err) {
            Logger.error("Failed to seed V2 plans", err);
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new AdminController();
