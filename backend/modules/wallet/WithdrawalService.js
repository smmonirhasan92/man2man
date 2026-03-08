const TransactionHelper = require('../common/TransactionHelper');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const Logger = require('../common/Logger');

class WithdrawalService {

    // Fees Config
    FEES = {
        standard: 0.00, // 0% (Fee Paid on Transfer)
        express: 0.00
    };

    /**
     * Request Withdrawal
     * STRICT: Always deduct from 'wallet.main'.
     */
    async requestWithdrawal(userId, amount, method, details, tier = 'standard', agentId = null, idempotencyKey = null, deliveryTime = '24h') {
        return await TransactionHelper.runTransaction(async (session) => {
            const opts = session ? { session } : {};

            // 1. Idempotency Check
            if (idempotencyKey) {
                const existing = await Transaction.findOne({ 'metadata.idempotencyKey': idempotencyKey }).setOptions(opts);
                if (existing) {
                    Logger.warn(`[WITHDRAWAL] Duplicate Request Ignored (Key: ${idempotencyKey})`);
                    return existing;
                }
            }

            // --- DYNAMIC MINIMUM WITHDRAWAL THRESHOLD ---
            const PlanService = require('../plan/PlanService');
            const activePlans = await PlanService.getActivePlans(userId);
            let minWithdrawalUsd = 5; // System Default: $5

            if (activePlans && activePlans.length > 0) {
                const Plan = require('../../modules/admin/PlanModel');
                const planDetails = await Plan.findById(activePlans[0].planId).setOptions(opts);
                if (planDetails && planDetails.min_withdrawal) {
                    minWithdrawalUsd = planDetails.min_withdrawal;
                }
            }

            // Assuming 50 NXS = 1 USD in this platform (as per hardcoded hint "50 NXS ($1.00 USD)")
            const minWithdrawalNxs = minWithdrawalUsd * 50;

            if (amount < minWithdrawalNxs) {
                throw new Error(`Minimum withdrawal limit is ${minWithdrawalNxs} NXS ($${minWithdrawalUsd} USD) based on your current package.`);
            }

            const fee = 0; // Fee is 0 on withdrawal execution

            // [TURNOVER CHECK]
            const TurnoverService = require('./TurnoverService');
            const eligibility = await TurnoverService.checkWithdrawalEligibility(userId);
            let status = agentId ? 'pending_admin_approval' : 'pending';
            let adminComment = null;

            if (!eligibility.allowed) {
                console.log(`[WITHDRAWAL] Turnover Not Met for ${userId}. BLOCKED.`);
                throw new Error(`Turnover Requirement Not Met! You must wager ৳${eligibility.stats.remaining.toLocaleString()} more to withdraw.`);
            }

            // 2. Atomic Balance Check & Deduct from MAIN WALLET ONLY
            const dbKey = 'wallet.main'; // STRICT
            const deductionAmount = amount; // Net Deduction

            // [FIX] Read current balance using Session explicitly
            const userCheck = await User.findById(userId).select(dbKey).session(session);
            if (!userCheck || (userCheck.wallet.main || 0) < deductionAmount) {
                throw new Error(`Insufficient Main Wallet Balance.`);
            }

            const update = { $inc: { [dbKey]: -deductionAmount } };
            const user = await User.findOneAndUpdate({ _id: userId }, update, { new: true, ...opts });

            // [REDIS] Invalidate Cache
            try {
                const redisInv = require('../../config/redis');
                await redisInv.client.del(`user_profile:${userId}`);
            } catch (e) { }

            // 3. Create Transaction
            const txn = await Transaction.create([{
                userId,
                type: 'withdraw',
                amount: -amount,
                status: status,
                adminComment: adminComment,
                recipientDetails: `[${deliveryTime}] ${method} - ${details}`,
                description: `Withdrawal Request (Main Wallet)`,
                fee: fee,
                metadata: {
                    idempotencyKey,
                    agentId,
                    deliveryTime,
                    netPayout: amount, // No fee deduction here
                    sourceWallet: 'main',
                    turnoverStats: eligibility.stats
                }
            }], opts);

            Logger.info(`[WITHDRAWAL] User ${userId} req ${amount} (${deliveryTime}) from MAIN. Net: ${amount}`);

            return txn[0];
        });
    }
}

module.exports = new WithdrawalService();
