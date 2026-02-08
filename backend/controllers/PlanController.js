const PlanService = require('../modules/plan/PlanService');
const Plan = require('../modules/admin/PlanModel');

exports.purchasePlan = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { planId } = req.params;

        console.log(`[API] Purchase Plan Request: User ${userId}, Plan ${planId}`);

        // 1. Validate Plan
        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        if (!plan.is_active) return res.status(400).json({ message: 'Plan is inactive' });

        // 2. Execute Service (Includes Wallet & Referral Logic)
        const userPlan = await PlanService.purchasePlan(userId, planId);

        res.status(200).json({
            message: 'Plan purchased successfully',
            plan: userPlan
        });

    } catch (err) {
        console.error('Plan Purchase Error:', err);
        res.status(400).json({ message: err.message || 'Purchase Failed' });
    }
};

// [NEW] Seed Default Plans (One-time use or Admin Trigger)
exports.seedDefaultPlans = async (req, res) => {
    try {
        const plans = [
            // VIP Plans (Starter / Basic)
            {
                name: 'Starter Node US',
                type: 'vip',
                unlock_price: 1500, // Reduced from 2500 for entry level
                daily_limit: 5,
                task_reward: 2.0,
                validity_days: 365,
                is_active: true,
                server_id: 'SERVER_01', // [CRITICAL] Matches Task Fix
                features: ['Basic Access', 'US Node', 'Daily payout']
            },
            {
                name: 'Gold VIP Node',
                type: 'vip',
                unlock_price: 5000,
                daily_limit: 15,
                task_reward: 12.0, // Higher yield
                validity_days: 60,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['Priority Access', 'Gold Badge', 'Higher Limits']
            },
            {
                name: 'Diamond VIP Node',
                type: 'vip',
                unlock_price: 12000,
                daily_limit: 30,
                task_reward: 35.0,
                validity_days: 90,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['Max Speed', 'Diamond Badge', 'Dedicated Support']
            },

            // High Yield Server Plans
            {
                name: 'Virginia Dedicated Server',
                type: 'server',
                unlock_price: 25000,
                daily_limit: 50,
                task_reward: 80.0,
                validity_days: 45,
                is_active: true,
                server_id: 'SERVER_02', // Premium Pool
                features: ['Dedicated IP', 'Virginia Location', 'Zero Latency']
            }
        ];

        for (const p of plans) {
            // Upsert based on Name to avoid duplicates but update fields
            await Plan.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true, setDefaultsOnInsert: true });
        }

        res.json({ message: 'Plans Seeded Successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ is_active: true });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMyActivePlans = async (req, res) => {
    try {
        const plans = await PlanService.getActivePlans(req.user.user.id);
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
