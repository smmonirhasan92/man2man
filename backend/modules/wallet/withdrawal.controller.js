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

            // [MANDATORY SECURITY] Email must be verified before any withdrawal
            if (!user.emailVerified) {
                throw new Error('You must complete email verification before withdrawing. Please add an email in your profile.');
            }

            // --- 3.5% ADMIN WITHDRAWAL FEE ---
            // Fee is deducted FROM the requested amount.
            // If user requests 100 NXS, 100 NXS is deducted from wallet, 3.5 NXS is fee, 96.5 NXS is payable.
            const ADMIN_FEE_PERCENT = 0.035;
            const feeAmount = parsedAmount * ADMIN_FEE_PERCENT;
            const payableAmount = parsedAmount - feeAmount;

            if (currentBalance < parsedAmount) {
                throw new Error(`Insufficient ${targetWallet} Balance. You need at least ${parsedAmount.toFixed(2)} NXS.`);
            }

            // --- TURNOVER FLAG CHECK (WITH SESSION) ---
            const eligibility = await TurnoverService.checkWithdrawalEligibility(userId, session);
            if (!eligibility.allowed) {
                throw new Error(eligibility.message);
            }

            // Deduct total amount (Requested Amount)
            user.wallet[targetWallet] = (currentBalance - parsedAmount);
            await user.save({ session });

            let newStatus = 'pending';
            let adminComment = null;
            let gatewayTrxId = null;

            const [transaction] = await Transaction.create([{
                userId,
                type: 'cash_out',
                amount: -payableAmount, // This is the amount the Admin has to pay in real life
                status: newStatus,
                recipientDetails: `${method} - ${accountDetails} (${targetWallet} wallet)`,
                description: `Withdrawal Request from ${targetWallet} wallet`,
                adminComment: adminComment,
                gatewayTransactionId: gatewayTrxId,
                metadata: { feeCharged: feeAmount, requestedAmount: parsedAmount }
            }, {
                userId,
                type: 'fee',
                amount: -feeAmount,
                status: 'pending', // Will complete or reject with main transaction
                description: `Admin Withdrawal Platform Fee (3.5%)`,
                metadata: { relatedTrxType: 'cash_out' }
            }], { session, ordered: true });

            return transaction;
        });

        // --- Emit Real-time Update to Admin Room ---
        const SocketService = require('../common/SocketService');
        SocketService.broadcast('admin_dashboard', 'new_transaction_request', { 
            transactionId: result._id, 
            status: result.status,
            type: 'withdraw',
            message: `New Cash-out Request: ${parsedAmount} NXS`
        });

        res.json({ message: 'Withdrawal requested successfully', transaction: result });

    } catch (err) {
        console.error('Withdrawal Error:', err);
        const isTurnoverError = err.message.includes('Turnover Requirement Not Met');
        const status = isTurnoverError ? 403 : 500;
        const msg = isTurnoverError ? `Turnover requirement not met! You need to play games worth ${err.message.split('NXS')[0]?.split('more ')[1] || 'some amount'} NXS more to unlock withdrawals.` : (err.message || 'Server Error');
        res.status(status).json({ message: msg, retentionLock: isTurnoverError });
    }
};

// Get Withdrawals (Admin)
exports.getWithdrawals = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { type: 'cash_out' };
        if (status) {
            query.status = status.includes(',') ? { $in: status.split(',') } : status;
        }

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
                throw new Error('Withdrawal request not found!');
            }

            if (transaction.status !== 'pending' && transaction.status !== 'expired') {
                throw new Error('This request has already been processed or finalized!');
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
                    const feeRefund = transaction.metadata?.feeCharged || (refundAmount * 0.035);
                    const totalRefund = refundAmount + feeRefund;

                    const isIncome = transaction.description && transaction.description.includes('income wallet');
                    const targetWallet = isIncome ? 'income' : 'main';

                    user.wallet[targetWallet] += totalRefund;
                    await user.save({ session });

                    // Also reject the associated fee transaction
                    await Transaction.findOneAndUpdate(
                        { userId: transaction.userId, type: 'fee', status: 'pending', amount: -feeRefund },
                        { $set: { status: 'rejected' } },
                        { session }
                    );
                }
            }

            // CASE 2: COMPLETED -> Reimburse the Agent + Commission
            else if (status === 'completed') {
                // Mark the fee transaction as completed
                const feeAmount = transaction.metadata?.feeCharged || (Math.abs(transaction.amount) * 0.035);
                await Transaction.findOneAndUpdate(
                    { userId: transaction.userId, type: 'fee', status: 'pending', amount: -feeAmount },
                    { $set: { status: 'completed' } },
                    { session }
                );

                // Add the collected fee to Admin Reserve
                await SystemSetting.findOneAndUpdate(
                    { key: 'admin_reserve_fund' },
                    { $inc: { value: feeAmount } },
                    { upsert: true, session }
                );

                const processingAgentId = agentId || transaction.assignedAgentId;
                if (processingAgentId) {
                    const agent = await User.findById(processingAgentId).session(session);
                    if (!agent) throw new Error('Assigned agent not found!');

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
                    }], { session, ordered: true });

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
                        }], { session, ordered: true });
                    }
                }
            }
            return transaction;
        });

        // --- Post-Processing Notifications ---
        try {
            const SocketService = require('../common/SocketService');
            const NotificationService = require('../notification/NotificationService');
            
            let eventMsg = status === 'completed' 
                ? '✅ Your withdrawal has been approved! Funds will arrive within 10-15 minutes.' 
                : '❌ Your withdrawal has been rejected.';
            
            if (status === 'rejected' && adminComment) {
                eventMsg += ` Reason: ${adminComment}`;
            }

            // Save to DB & Send Push Notification
            await NotificationService.send(
                result.userId, 
                eventMsg, 
                status === 'completed' ? 'success' : 'error', 
                { title: 'Withdrawal Update' }
            );

            // Also update the specific transaction view
            SocketService.broadcast(`user_${result.userId}`, 'transaction_update', { transactionId: result._id, status });
            SocketService.broadcast('admin_dashboard', 'transaction_update', { transactionId: result._id, status });
        } catch (syncErr) { console.error('Withdrawal Sync Error:', syncErr); }

        res.json({ message: `Withdrawal status updated: ${status}`, transaction: result });

    } catch (err) {
        console.error('processWithdrawal Error:', err);
        res.status(500).json({ message: err.message || 'Server Error! Please try again.' });
    }
};
