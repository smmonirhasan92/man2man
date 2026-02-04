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

            if (amount < 100) throw new Error("Minimum withdrawal is 100 BDT"); // BDT

            const fee = 0; // Fee is 0 on withdrawal execution

            // 2. Atomic Balance Check & Deduct from MAIN WALLET ONLY
            const dbKey = 'wallet.main'; // STRICT
            const deductionAmount = amount; // Net Deduction

            const query = { _id: userId };
            query[dbKey] = { $gte: deductionAmount };

            const update = { $inc: { [dbKey]: -deductionAmount } };

            const user = await User.findOneAndUpdate(query, update, { new: true, ...opts });

            if (!user) {
                // Check fail reason
                const exists = await User.findById(userId);
                const bal = exists ? exists.wallet.main : 0;
                throw new Error(`Insufficient Main Wallet Balance. Need ${deductionAmount} BDT, Available: ${bal} BDT. Please transfer funds from Income Wallet first.`);
            }

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
                status: agentId ? 'pending_admin_approval' : 'pending',
                recipientDetails: `[${deliveryTime}] ${method} - ${details}`,
                description: `Withdrawal Request (Main Wallet)`,
                fee: fee,
                metadata: {
                    idempotencyKey,
                    agentId,
                    deliveryTime,
                    netPayout: amount, // No fee deduction here
                    sourceWallet: 'main'
                }
            }], opts);

            Logger.info(`[WITHDRAWAL] User ${userId} req ${amount} (${deliveryTime}) from MAIN. Net: ${amount}`);

            return txn[0];
        });
    }
}

module.exports = new WithdrawalService();
