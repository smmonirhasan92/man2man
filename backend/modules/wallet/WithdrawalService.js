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

            // 4. [NEW] Minimum Package Check (Security Guard)
            const UserPlanForWithdraw = require('../plan/UserPlanModel');
            const PlanForWithdraw = require('../admin/PlanModel');
            const userPlans = await UserPlanForWithdraw.find({ userId }).session(session);
            let hasMinPackage = false;
            if (userPlans.length > 0) {
                const planIds = userPlans.map(p => p.planId);
                const plans = await PlanForWithdraw.find({ _id: { $in: planIds }, unlock_price: { $gte: 500 } }).session(session);
                if (plans.length > 0) hasMinPackage = true;
            }
            if (!hasMinPackage) {
                throw new Error("উইথড্র করার জন্য আপনাকে অন্তত ৫০০ NXS ($5) মূল্যের একটি প্যাকেজ কিনে অ্যাকাউন্ট ভেরিফাই করতে হবে।");
            }

            // 5. Balance Check & Deduct
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('ইউজার পাওয়া যায়নি!');
            
            // --- [NEW] SMART LOAN AUTO-RECOVERY ---
            if (user.is_loan_active && (user.wallet.loan_due || 0) > 0) {
                const requiredAmount = amount + user.wallet.loan_due;
                if ((user.wallet.main || 0) >= requiredAmount) {
                    // Auto recover the loan
                    user.wallet.main -= user.wallet.loan_due;
                    
                    // Create Transaction Log for Loan Recovery
                    await Transaction.create([{
                        userId: user._id,
                        type: 'admin_debit',
                        amount: -user.wallet.loan_due,
                        status: 'completed',
                        description: `Smart Loan Auto-Recovery (${user.wallet.loan_due} NXS)`,
                        adminComment: 'System Auto-Recovery'
                    }], opts);

                    user.wallet.loan_due = 0;
                    user.is_loan_active = false;
                } else {
                    throw new Error(`আপনার ${user.wallet.loan_due} NXS লোন বকেয়া আছে। উইথড্র করার জন্য পর্যাপ্ত ব্যালেন্স নেই।`);
                }
            }

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

            // [NEW] Real-time Admin Notification
            try {
                const SocketService = require('../common/SocketService');
                SocketService.broadcast('admin_dashboard', 'new_transaction_request', {
                    type: 'withdraw',
                    amount: amount,
                    userId: userId,
                    message: `New Withdrawal Request: ${amount} NXS`
                });
            } catch (e) {
                Logger.error(`[SOCKET] Failed to broadcast withdrawal alert: ${e.message}`);
            }

            Logger.info(`[WITHDRAWAL] User ${userId} requested ${amount} NXS from MAIN.`);
            return txn;
        });
    }
}

module.exports = new WithdrawalService();
