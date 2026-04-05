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
                const existing = await Transaction.findOne({ 'metadata.idempotencyKey': idempotencyKey });
                if (existing) {
                    Logger.warn(`[WITHDRAWAL] Duplicate Request Ignored (Key: ${idempotencyKey})`);
                    return existing;
                }
            }

            // 2. Minimum Withdrawal Threshold (default 250 NXS = $5)
            const minWithdrawalNxs = 250;
            if (amount < minWithdrawalNxs) {
                throw new Error(`⚠️ সর্বনিম্ন উইথড্রয়াল সীমা ${minWithdrawalNxs} NXS। অনুগ্রহ করে আরও ব্যালেন্স জমা করুন।`);
            }

            // 3. Turnover Guard
            const TurnoverService = require('./TurnoverService');
            const eligibility = await TurnoverService.checkWithdrawalEligibility(userId);
            if (!eligibility.allowed) {
                throw new Error(eligibility.message);
            }

            // 4. Balance Check & Deduct
            const user = await User.findById(userId);
            if (!user) throw new Error('ইউজার পাওয়া যায়নি!');
            if ((user.wallet.main || 0) < amount) {
                throw new Error(`❌ অপর্যাপ্ত মেইন ওয়ালেট ব্যালেন্স! আপনার ব্যালেন্স: ${(user.wallet.main || 0).toFixed(2)} NXS`);
            }

            user.wallet.main -= amount;
            await user.save(opts);

            // 5. Invalidate Redis Cache
            try {
                const redisInv = require('../../config/redis');
                if (redisInv.client && redisInv.client.isOpen) {
                    await redisInv.client.del(`user_profile:${userId}`);
                }
            } catch (e) { }

            // 6. Create Transaction Record
            const status = agentId ? 'pending_admin_approval' : 'pending';
            const [txn] = await Transaction.create([{
                userId,
                type: 'withdraw',
                amount: -amount,
                status,
                adminComment: null,
                recipientDetails: `[${deliveryTime}] ${method} - ${details}`,
                description: `Withdrawal Request (Main Wallet)`,
                fee: 0,
                metadata: {
                    idempotencyKey,
                    agentId,
                    deliveryTime,
                    netPayout: amount,
                    sourceWallet: 'main',
                    turnoverStats: eligibility.stats
                }
            }], opts);

            Logger.info(`[WITHDRAWAL] User ${userId} requested ${amount} NXS from MAIN.`);
            return txn;
        });
    }
}

module.exports = new WithdrawalService();
