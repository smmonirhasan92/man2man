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
            // VIP Plans
            { name: 'Starter', type: 'vip', unlock_price: 0, daily_limit: 5, task_reward: 2.0, validity_days: 365, is_active: true },
            { name: 'Gold VIP', type: 'vip', unlock_price: 1300, daily_limit: 15, task_reward: 5.0, validity_days: 60, is_active: true },
            { name: 'Diamond VIP', type: 'vip', unlock_price: 5000, daily_limit: 30, task_reward: 10.0, validity_days: 90, is_active: true },

            // Server Plans
            { name: 'USA Server', type: 'server', unlock_price: 2500, daily_limit: 50, task_reward: 15.0, validity_days: 30, is_active: true, features: ['Dedicated IP', 'US Location'] },

            // Number Plans
            { name: 'US Virtual Number', type: 'number', unlock_price: 500, daily_limit: 0, task_reward: 0, validity_days: 30, is_active: true, features: ['SMS Verification', 'US +1 Code'] }
        ];

        for (const p of plans) {
            await Plan.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true });
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
