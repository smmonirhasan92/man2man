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
        // [USER REQUEST] 6 Organized Plans (1k - 25k BDT)
        // Ensure server_id is 'SERVER_01' so tasks are visible for all.
        const plans = [
            // Plan 1: Starter (1,000 BDT)
            {
                name: 'Starter Node',
                type: 'vip',
                unlock_price: 1000,
                daily_limit: 5,
                task_reward: 6.0, // ~30 BDT/day
                validity_days: 45,
                is_active: true,
                server_id: 'SERVER_01', // All on Server 01 for visibility
                features: ['Basic Task Access', 'Daily Payout', 'Email Support']
            },
            // Plan 2: Basic (2,500 BDT)
            {
                name: 'Basic Node',
                type: 'vip',
                unlock_price: 2500,
                daily_limit: 10,
                task_reward: 8.0, // ~80 BDT/day
                validity_days: 45,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['Standard Access', 'Faster Withdrawals', 'Basic Badge']
            },
            // Plan 3: Pro (5,000 BDT)
            {
                name: 'Pro Node',
                type: 'vip',
                unlock_price: 5000,
                daily_limit: 15,
                task_reward: 12.0, // ~180 BDT/day
                validity_days: 60,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['Priority Access', 'Silver Badge', '24/7 Support']
            },
            // Plan 4: Expert (10,000 BDT)
            {
                name: 'Expert Node',
                type: 'vip',
                unlock_price: 10000,
                daily_limit: 25,
                task_reward: 15.0, // ~375 BDT/day
                validity_days: 60,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['High Speed', 'Gold Badge', 'Dedicated Manager']
            },
            // Plan 5: Elite (15,000 BDT)
            {
                name: 'Elite Server',
                type: 'server',
                unlock_price: 15000,
                daily_limit: 40,
                task_reward: 18.0, // ~720 BDT/day
                validity_days: 75,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['Dedicated IP', 'Platinum Badge', 'Zero Fees']
            },
            // Plan 6: Master (25,000 BDT)
            {
                name: 'Master Server',
                type: 'server',
                unlock_price: 25000,
                daily_limit: 60,
                task_reward: 20.0, // ~1200 BDT/day
                validity_days: 90,
                is_active: true,
                server_id: 'SERVER_01',
                features: ['Full Resources', 'Diamond Badge', 'VIP Club Access']
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
