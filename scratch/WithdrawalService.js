const TransactionHelper = require('../common/TransactionHelper');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const Logger = require('../common/Logger');

class WithdrawalService {

    // Fees Config
    FEES = {
        standard: 0.00,
        express: 0.00
    };

    /**
     * Request Withdrawal
     * UPDATED: Removed Package/Email restrictions for "No Restriction" launch phase.
     */
    async requestWithdrawal(userId, amount, method, details, tier = 'standard', agentId = null, idempotencyKey = null, deliveryTime = '24h') {
        return await TransactionHelper.runTransaction(async (session) => {
            const opts = session ? { session } : {};

            // 1. Anti-Duplicate Check
            const pendingTx = await Transaction.findOne({
                userId,
                type: 'withdraw',
                status: 'pending'
            }).session(session);

            if (pendingTx) {
                throw new Error('আপনার একটি উইথড্র রিকোয়েস্ট ইতিমধ্যে পেন্ডিং আছে।');
            }

            // 2. Minimum Withdrawal Limit (STRICT: 500 NXS = $5)
            const minWithdrawalNxs = 500;
            if (amount < minWithdrawalNxs) {
                throw new Error(`⚠️ সর্বনিম্ন উইথড্রয়াল সীমা ${minWithdrawalNxs} NXS ($৫.০০ USD)।`);
            }

            // 3. Turnover Guard (Forced Allowed in Service)
            const TurnoverService = require('./TurnoverService');
            const eligibility = await TurnoverService.checkWithdrawalEligibility(userId);
            if (!eligibility.allowed) {
                throw new Error(eligibility.message);
            }

            // 4. [RESTRICTION REMOVED] Package Check & Email Verification
            // No longer checking for hasMinPackage or emailVerified to ensure "No Restrictions"

            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('ইউজার পাওয়া যায়নি!');
            
            // SMART LOAN AUTO-RECOVERY (Financial necessity, keeping this)
            if (user.is_loan_active && (user.wallet.loan_due || 0) > 0) {
                const requiredAmount = amount + user.wallet.loan_due;
                if ((user.wallet.main || 0) >= requiredAmount) {
                    user.wallet.main -= user.wallet.loan_due;
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
                throw new Error(`❌ অপর্যাপ্ত মেইন ওয়ালেট ব্যালেন্স!`);
            }

            user.wallet.main -= amount;
            await user.save(opts);

            // 5. Create Transaction Record
            const status = 'pending';
            const [txn] = await Transaction.create([{
                userId,
                type: 'withdraw',
                amount: -amount,
                status,
                recipientDetails: `[${deliveryTime}] ${method} - ${details}`,
                description: `Withdrawal Request (Main Wallet)`,
                metadata: {
                    idempotencyKey,
                    agentId,
                    deliveryTime,
                    netPayout: amount,
                    sourceWallet: 'main'
                }
            }], opts);

            // Notify Admin
            try {
                const SocketService = require('../common/SocketService');
                SocketService.broadcast('admin_dashboard', 'new_transaction_request', {
                    type: 'withdraw',
                    amount: amount,
                    userId: userId,
                    message: `New Withdrawal Request: ${amount} NXS`,
                    sound: 'p2p_alert' 
                });
            } catch (e) { }

            return txn;
        });
    }
}

module.exports = new WithdrawalService();
