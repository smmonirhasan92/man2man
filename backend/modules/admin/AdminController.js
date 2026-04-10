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
            const TaskAd = require('../task/TaskAdModel');
            
            // FINAL PLANS CONFIGURATION (Approved)
            const PLANS = [
                {
                    node_code: 'PLAN_V2_01',
                    name: 'Nano Node',
                    price: 260,
                    daily_limit: 5,
                    task_reward: 3.9,
                    validity_days: 16,
                    server_id: 'SERVER_01'
                },
                {
                    node_code: 'PLAN_V2_02',
                    name: 'Lite Node',
                    price: 495,
                    daily_limit: 7,
                    task_reward: 5.2,
                    validity_days: 18,
                    server_id: 'SERVER_02'
                },
                {
                    node_code: 'PLAN_V2_03',
                    name: 'Turbo Node',
                    price: 750,
                    daily_limit: 7,
                    task_reward: 5.5,
                    validity_days: 24,
                    server_id: 'SERVER_03'
                },
                {
                    node_code: 'PLAN_V2_04',
                    name: 'Ultra Node',
                    price: 1100,
                    daily_limit: 8,
                    task_reward: 5.7,
                    validity_days: 30,
                    server_id: 'SERVER_04'
                },
                {
                    node_code: 'PLAN_V2_05',
                    name: 'Omega Node',
                    price: 1450,
                    daily_limit: 9,
                    task_reward: 5.9,
                    validity_days: 35,
                    server_id: 'SERVER_05'
                }
            ];

            const results = [];

            for (let i = 0; i < PLANS.length; i++) {
                const p = PLANS[i];
                
                const totalReturn = p.daily_limit * p.task_reward * p.validity_days;
                const roiPercentage = (totalReturn / p.price) * 100;

const CURRENCY = require('../../config/currency');

                const planData = {
                    name: p.name, // Exactly as inputted by user
                    type: 'server',
                    unlock_price: p.price,
                    price_usd: (p.price * CURRENCY.NXS_TO_USD).toFixed(2), // Normalized to 1 Cent
                    validity_days: p.validity_days,
                    daily_limit: p.daily_limit,
                    task_reward: p.task_reward,
                    roi_percentage: parseFloat(roiPercentage.toFixed(2)),
                    server_id: p.server_id,
                    node_code: p.node_code,
                    features: [
                        'Dedicated Network Node',
                        `${p.daily_limit} Guaranteed Tasks Daily`,
                        `Total Earn: ${totalReturn % 1 === 0 ? totalReturn : totalReturn.toFixed(1)} NXS`,
                        `Validity: ${p.validity_days} Days`
                    ],
                    is_active: true
                };

                const updatedPlan = await Plan.findOneAndUpdate(
                    { node_code: p.node_code },
                    planData,
                    { upsert: true, new: true }
                );
                results.push(updatedPlan.name);

                // --- SEED TASKS ---
                const taskCount = await TaskAd.countDocuments({ server_id: updatedPlan.server_id });

                if (taskCount < p.daily_limit) {
                    const tasksToSeed = [];
                    for (let t = 1; t <= p.daily_limit; t++) {
                        tasksToSeed.push({
                            title: `Sponsored Content ${p.server_id.replace('SERVER_', '#')}-${t}`,
                            url: "https://google.com",
                            imageUrl: "https://via.placeholder.com/150",
                            duration: 10,
                            server_id: updatedPlan.server_id,
                            type: 'ad_view',
                            is_active: true,
                            priority: 100 - t
                        });
                    }
                    await TaskAd.insertMany(tasksToSeed);
                    Logger.info(`[ADMIN] Seeded ${p.daily_limit} Tasks for ${updatedPlan.server_id}`);
                }
            }

            // Disable old plans not in this final list
            await Plan.updateMany(
                { node_code: { $nin: PLANS.map(p => p.node_code) } },
                { $set: { is_active: false } }
            );

            Logger.info(`[ADMIN] Seeded ${results.length} Final V2 Plans + Tasks via API`);
            return res.json({ success: true, message: "Final Plans Seeded Successfully", plans: results });

        } catch (err) {
            Logger.error("Failed to seed final plans", err);
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new AdminController();
