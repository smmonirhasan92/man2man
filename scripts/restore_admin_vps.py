
import os

file_path = '/var/www/man2man/backend/modules/admin/AdminController.js'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'async seedPlansV2' in line:
        break
    new_lines.append(line)

# Append the correct versions of all missing methods
methods = """    async seedPlansV2(req, res) {
        try {
            const PLANS = [
                { node_code: 'PLAN_V2_01', name: 'Nano Node', price: 260, daily_limit: 5, task_reward: 3.9, validity_days: 16, server_id: 'SERVER_01' },
                { node_code: 'PLAN_V2_02', name: 'Lite Node', price: 495, daily_limit: 7, task_reward: 5.2, validity_days: 18, server_id: 'SERVER_02' },
                { node_code: 'PLAN_V2_03', name: 'Turbo Node', price: 750, daily_limit: 7, task_reward: 5.5, validity_days: 24, server_id: 'SERVER_03' },
                { node_code: 'PLAN_V2_04', name: 'Ultra Node', price: 1100, daily_limit: 8, task_reward: 5.7, validity_days: 30, server_id: 'SERVER_04' },
                { node_code: 'PLAN_V2_05', name: 'Omega Node', price: 1450, daily_limit: 9, task_reward: 5.9, validity_days: 35, server_id: 'SERVER_05' }
            ];
            const results = [];
            const Plan = require('./PlanModel');
            const TaskAd = require('../task/TaskAdModel');
            const CURRENCY = require('../../config/currency');
            for (let p of PLANS) {
                const totalReturn = p.daily_limit * p.task_reward * p.validity_days;
                const roiPercentage = (totalReturn / p.price) * 100;
                const planData = {
                    name: p.name, type: 'server', unlock_price: p.price,
                    price_usd: (p.price * CURRENCY.NXS_TO_USD).toFixed(2), validity_days: p.validity_days,
                    daily_limit: p.daily_limit, task_reward: p.task_reward,
                    roi_percentage: parseFloat(roiPercentage.toFixed(2)),
                    server_id: p.server_id, node_code: p.node_code,
                    features: ['Dedicated Node', `${p.daily_limit} Tasks`, `ROI: ${roiPercentage.toFixed(0)}%`],
                    is_active: true
                };
                const updatedPlan = await Plan.findOneAndUpdate({ node_code: p.node_code }, planData, { upsert: true, new: true });
                results.push(updatedPlan.name);
            }
            return res.json({ success: true, plans: results });
        } catch (err) { return res.status(500).json({ message: err.message }); }
    }

    async getEmpireUsers(req, res) {
        try {
            const User = require('../user/UserModel');
            const users = await User.find({ $or: [{ 'referralEmpire.sharesCount': { $gt: 0 } }, { 'referralEmpire.holdBalance': { $gt: 0 } }] })
                .select('username fullName referralEmpire referralCount wallet.income').sort({ 'referralEmpire.holdBalance': -1 });
            return res.json({ success: true, users });
        } catch (e) { return res.status(500).json({ message: e.message }); }
    }

    async releaseEmpireBonus(req, res) {
        try {
            const User = require('../user/UserModel');
            const Transaction = require('../transaction/TransactionModel');
            const { userId } = req.body;
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });
            const amount = user.referralEmpire?.holdBalance || 0;
            if (amount <= 0) return res.status(400).json({ message: "No balance" });
            user.wallet.income += amount;
            user.referralIncome += amount;
            user.referralEmpire.holdBalance = 0;
            await user.save();
            await Transaction.create({ userId: user._id, type: 'referral_commission', amount, status: 'completed', description: 'Empire Bonus Release' });
            return res.json({ success: true, message: 'Released' });
        } catch (e) { return res.status(500).json({ message: e.message }); }
    }
}

module.exports = new AdminController();
"""

with open(file_path, 'w') as f:
    f.writelines(new_lines)
    f.write(methods)

print("AdminController restored successfully")
