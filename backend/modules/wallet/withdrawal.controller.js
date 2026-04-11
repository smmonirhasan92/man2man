const mongoose = require('mongoose');
const WithdrawalService = require('./WithdrawalService');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const SystemSetting = require('../settings/SystemSettingModel');
const TransactionHelper = require('../common/TransactionHelper');
const ReferralService = require('../referral/ReferralService');
const TurnoverService = require('./TurnoverService');

exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, method, accountDetails, walletType } = req.body; 
        const userId = req.user.user.id;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new Error('User not found');
            }

            const targetWallet = walletType === 'income' ? 'income' : 'main';
            const currentBalance = user.wallet[targetWallet];

            if (currentBalance < parsedAmount) {
                throw new Error(`Insufficient ${targetWallet} Balance`);
            }

            // --- TURNOVER FLAG CHECK (WITH SESSION) ---
            const eligibility = await TurnoverService.checkWithdrawalEligibility(userId, session);
            if (!eligibility.allowed) {
                throw new Error(eligibility.message);
            }

            // Deduct
            user.wallet[targetWallet] = (currentBalance - parsedAmount);
            await user.save({ session });

            let newStatus = 'pending';
            let adminComment = null;
            let gatewayTrxId = null;

            if (parsedAmount < 5000) {
                newStatus = 'completed';
                adminComment = 'Auto-Approved by Settlement Gateway (Under 5k limit)';
                gatewayTrxId = `AUTO_${Date.now()}`;
            }

            const [transaction] = await Transaction.create([{
                userId,
                type: 'cash_out',
                amount: -parsedAmount,
                status: newStatus,
                recipientDetails: `${method} - ${accountDetails} (${targetWallet} wallet)`,
                description: `Withdrawal Request from ${targetWallet} wallet`,
                adminComment: adminComment,
                gatewayTransactionId: gatewayTrxId
            }], { session });

            return transaction;
        });

        // --- Emit Real-time Update to Admin Room ---
        const SocketService = require('../common/SocketService');
        SocketService.broadcast('admin_dashboard', 'transaction_update', { 
            transactionId: result._id, 
            status: result.status,
            message: 'New Cash-out Request'
        });

        res.json({ message: 'Withdrawal requested successfully', transaction: result });

    } catch (err) {
        console.error('Withdrawal Error:', err);
        const isTurnoverError = err.message.includes('Turnover Requirement Not Met');
        const status = isTurnoverError ? 403 : 500;
        const msg = isTurnoverError ? `টার্নওভার পূর্ণ হয়নি! গেম খেলে আপনাকে আরও ৳${err.message.split('৳')[1] || 'কিছু টাকা'} এর লিমিট পূর্ণ করতে হবে।` : (err.message || 'Server Error');
        res.status(status).json({ message: msg, retentionLock: isTurnoverError });
    }
};

// Get Withdrawals (Admin)
exports.getWithdrawals = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { type: 'cash_out' };
        if (status) query.status = status;

        const withdrawals = await Transaction.find(query)
            .populate('userId', 'fullName phone username')
            .sort({ createdAt: -1 });

        res.json(withdrawals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Process Withdrawal (Admin: Approve/Reject)
exports.processWithdrawal = async (req, res) => {
    try {
        const { transactionId, status, adminComment, agentId } = req.body;
        // status: 'completed' or 'rejected'

        const result = await TransactionHelper.runTransaction(async (session) => {
            const transaction = await Transaction.findById(transactionId).session(session);
            if (!transaction || transaction.type !== 'cash_out') {
                throw new Error('উইথড্রয়াল রিকোয়েস্ট পাওয়া যায়নি!');
            }

            if (transaction.status !== 'pending') {
                throw new Error('এই রিকোয়েস্টটি ইতিমধ্যে প্রসেস করা হয়েছে!');
            }

            transaction.status = status;
            transaction.adminComment = adminComment;
            if (agentId) transaction.assignedAgentId = agentId;

            await transaction.save({ session });

            // CASE 1: REJECTED -> Refund the User
            if (status === 'rejected') {
                const user = await User.findById(transaction.userId).session(session);
                if (user) {
                    const refundAmount = Math.abs(transaction.amount);
                    const isIncome = transaction.description && transaction.description.includes('income wallet');
                    const targetWallet = isIncome ? 'income' : 'main';

                    user.wallet[targetWallet] += refundAmount;
                    await user.save({ session });
                }
            }

            // CASE 2: COMPLETED -> Reimburse the Agent + Commission
            else if (status === 'completed') {
                const processingAgentId = agentId || transaction.assignedAgentId;
                if (processingAgentId) {
                    const agent = await User.findById(processingAgentId).session(session);
                    if (!agent) throw new Error('এসাইন্ড এজেন্ট পাওয়া যায়নি!');

                    const reimbursementAmount = Math.abs(transaction.amount);
                    const settingsDoc = await SystemSetting.findOne({ key: 'cash_out_commission_percent' }).session(session);
                    const commissionPercent = settingsDoc ? parseFloat(settingsDoc.value) : 0;
                    const commissionAmount = reimbursementAmount * (commissionPercent / 100);
                    const totalCredit = reimbursementAmount + commissionAmount;

                    agent.wallet.main = (agent.wallet.main || 0) + totalCredit;
                    // Explicitly saving with session
                    await agent.save({ session });

                    // Log Reimbursement
                    await Transaction.create([{
                        userId: processingAgentId,
                        type: 'admin_credit',
                        amount: reimbursementAmount,
                        status: 'completed',
                        description: `Reimbursement for Cash-Out TrxID: ${transactionId}`,
                        recipientDetails: `User: ${transaction.userId} Cash Out`,
                        relatedUserId: transaction.userId
                    }], { session });

                    // Log Commission
                    if (commissionAmount > 0) {
                        await Transaction.create([{
                            userId: processingAgentId,
                            type: 'commission',
                            amount: commissionAmount,
                            status: 'completed',
                            description: `Commission (${commissionPercent}%) for Cash-Out TrxID: ${transactionId}`,
                            recipientDetails: `System Bonus`,
                            relatedUserId: transaction.userId
                        }], { session });
                    }
                }
            }
            return transaction;
        });

        // --- Post-Processing Socket Notifications ---
        try {
            const SocketService = require('../common/SocketService');
            const eventMsg = status === 'completed' ? 'আপনার উইথড্রয়াল এপ্রুভ হয়েছে!' : 'আপনার উইথড্রয়াল রিজেক্ট হয়েছে। বিস্তারিত চেক করুন।';
            SocketService.broadcast(`user_${result.userId}`, 'notification', { type: status === 'completed' ? 'success' : 'error', message: eventMsg });
            SocketService.broadcast(`user_${result.userId}`, 'transaction_update', { transactionId: result._id, status });
            SocketService.broadcast('admin_dashboard', 'transaction_update', { transactionId: result._id, status });
        } catch (syncErr) { console.error('Withdrawal Sync Error:', syncErr); }

        res.json({ message: `উইথড্রয়াল স্ট্যাটাস আপডেট হয়েছে: ${status}`, transaction: result });

    } catch (err) {
        console.error('processWithdrawal Error:', err);
        res.status(500).json({ message: err.message || 'সার্ভার এরর! দয়া করে আবার চেষ্টা করুন।' });
    }
};
