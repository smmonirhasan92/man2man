const mongoose = require('mongoose');
const Plan = require('../../modules/admin/PlanModel');
const UserPlan = require('./UserPlanModel');
const User = require('../../modules/user/UserModel');
const { runTransaction } = require('../common/TransactionHelper');

class PlanService {

    // lazy load downstream services to avoid circular require issues
    get ReferralService() {
        return require('../referral/ReferralService');
    }

    /**
     * Get all active plans for a user
     */
    async getActivePlans(userId) {
        const now = new Date();
        return await UserPlan.find({
            userId,
            status: 'active',
            expiryDate: { $gt: now }
        });
    }

    /**
     * Calculate Cumulative Daily Logic
     */
    /**
     * Calculate Daily Limit (Session Aware)
     */
    async getUserDailyLimit(userId, planId = null) {
        // [MODIFIED] If planId is provided (Secure Session), return limit of THAT plan only.
        if (planId) {
            const UserPlan = require('./UserPlanModel'); // lazy
            const activePlan = await UserPlan.findOne({ userId, _id: planId, status: 'active' });
            if (activePlan) return activePlan.dailyLimit;
        }

        // Fallback: Legacy Sum (if no specific session)
        const activePlans = await this.getActivePlans(userId);
        if (!activePlans.length) return 0;
        return activePlans.reduce((sum, plan) => sum + plan.dailyLimit, 0);
    }

    /**
     * Purchase a Plan
     */
    /**
     * Purchase a Plan
     */
    async purchasePlan(userId, planId) {
        return await runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            const plan = await Plan.findById(planId).session(session);

            if (!user) throw new Error('User not found.');
            if (!plan) throw new Error('Plan not found.');
            if (!plan.is_active) throw new Error('Plan is deprecated.');

            /* 
            // [MODIFIED] Multi-Server Support Enablement
            // Previously, purchasing a new server auto-terminated all existing sessions.
            // This restriction has been lifted per user requirement to allow multiple concurrent nodes.
            const existingActive = await UserPlan.updateMany(
                { userId, status: { $in: ['active', 'provisioning'] } },
                {
                    $set: {
                        status: 'terminated',
                        terminatedAt: new Date(),
                        remarks: 'Auto-Terminated by New Connection'
                    }
                }
            ).session(session);

            if (existingActive.modifiedCount > 0) {
                console.log(`[PlanService] Auto-Terminated ${existingActive.modifiedCount} previous sessions for User ${userId}`);
            }
            */

            // proceed to create new one...

            const purchaseBal = user.wallet.purchase || 0;
            const mainBal = user.wallet.main || 0;

            if ((purchaseBal + mainBal) < plan.unlock_price) {
                throw new Error('Insufficient Balance. Please deposit/recharge.');
            }

            let remainingCost = plan.unlock_price;

            // Deduct from Purchase Wallet First
            if (purchaseBal >= remainingCost) {
                user.wallet.purchase -= remainingCost;
                remainingCost = 0;
            } else {
                remainingCost -= purchaseBal;
                user.wallet.purchase = 0;
            }

            // Deduct Remainder from Main Wallet
            if (remainingCost > 0) {
                user.wallet.main -= remainingCost;
            }

            // [FIX] Create Transaction History for Purchase
            const Transaction = require('../wallet/TransactionModel');
            await Transaction.create([{
                userId: user._id,
                type: 'plan_purchase',
                amount: -plan.unlock_price,
                status: 'completed',
                description: `Purchased Server Node: ${plan.name}`,
                adminComment: 'Auto-Debit'
            }], { session });

            const validDays = plan.validity_days || 365;
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + validDays);

            // Mock US Server IP & Phone (IMMEDIATE)
            const serverIp = `104.28.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            const areaCode = Math.floor(Math.random() * (999 - 200) + 200);
            const prefix = Math.floor(Math.random() * (999 - 200) + 200);
            const line = Math.floor(Math.random() * 9000 + 1000);
            const syntheticPhone = `+1 (${areaCode}) ${prefix}-${line}`;

            user.synthetic_phone = syntheticPhone;
            if (!user.taskData) user.taskData = {};
            user.taskData.isActive = true;

            await user.save({ session });

            const userPlan = await UserPlan.create([{
                userId,
                planId: plan._id,
                planName: plan.name,
                dailyLimit: plan.daily_limit,
                expiryDate: expiry,
                status: 'active', // IMMEDIATE ACTIVATION
                serverIp: serverIp,
                serverLocation: 'Virginia, USA',
                syntheticPhone: syntheticPhone
            }], { session });

            // Emit Pure NXS Pricing to Referral System (1:1 ecosystem compatibility)
            await this.ReferralService.distributePlanCommission(user._id, plan.unlock_price, plan.name, session);

            return userPlan[0];
        });
    }

    // Deprecated provision check, but kept for legacy compat if needed
    async checkProvisioning(userId) {
        return null;
    }
}

module.exports = new PlanService();
