const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const TurnoverService = require('./TurnoverService');

exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, method, accountDetails } = req.body; 
        const userId = req.user.user.id;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        // [LIMIT CHECK] Minimum $5 (500 NXS)
        if (parsedAmount < 500) {
            return res.status(400).json({ message: 'Minimum withdrawal amount is 500 NXS ($5.00)' });
        }

        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            // [ANTI-DUPLICATE]
            const existingRequest = await Transaction.findOne({
                userId,
                type: 'cash_out',
                status: 'pending'
            }).session(session);

            if (existingRequest) {
                throw new Error('আপনার একটি উইথড্র রিকোয়েস্ট ইতিমধ্যে পেন্ডিং আছে।');
            }

            // [STRICT] Withdrawals ONLY from Main Wallet
            const currentBalance = user.wallet.main || 0;

            if (!user.emailVerified) {
                throw new Error('উইথড্র করার আগে ইমেইল ভেরিফিকেশন সম্পন্ন করুন।');
            }

            const ADMIN_FEE_PERCENT = 0.035;
            const feeAmount = parsedAmount * ADMIN_FEE_PERCENT;
            const payableAmount = parsedAmount - feeAmount;

            if (currentBalance < parsedAmount) {
                throw new Error('আপনার মেইন ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।');
            }

            const eligibility = await TurnoverService.checkWithdrawalEligibility(userId, session);
            if (!eligibility.allowed) throw new Error(eligibility.message);

            user.wallet.main = (currentBalance - parsedAmount);
            await user.save({ session });

            const [transaction] = await Transaction.create([{
                userId,
                type: 'cash_out',
                amount: -payableAmount,
                status: 'pending',
                recipientDetails: method + ' - ' + accountDetails,
                description: 'Withdrawal from Main Wallet',
                metadata: { feeCharged: feeAmount, requestedAmount: parsedAmount }
            }, {
                userId,
                type: 'fee',
                amount: -feeAmount,
                status: 'pending',
                description: 'Platform Fee (3.5%)',
                metadata: { relatedTrxType: 'cash_out' }
            }], { session, ordered: true });

            return transaction;
        });

        const SocketService = require('../common/SocketService');
        SocketService.broadcast('admin_dashboard', 'new_transaction_request', { 
            type: 'withdraw',
            amount: parsedAmount,
            message: 'New Withdrawal: ' + parsedAmount + ' NXS',
            sound: 'p2p_alert' 
        });

        res.json({ message: 'Withdrawal requested successfully', transaction: result });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getWithdrawals = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { type: 'cash_out' };
        if (status) query.status = status;
        const withdrawals = await Transaction.find(query).populate('userId', 'username phone').sort({ createdAt: -1 });
        res.json(withdrawals);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.processWithdrawal = async (req, res) => {
    try {
        const { transactionId, status, adminComment, agentId, sourceAccount } = req.body;
        const result = await TransactionHelper.runTransaction(async (session) => {
            const transaction = await Transaction.findById(transactionId).session(session);
            if (!transaction || transaction.type !== 'cash_out') throw new Error('Not found');
            if (transaction.status !== 'pending') throw new Error('Already processed');

            transaction.status = status;
            transaction.adminComment = adminComment;
            if (agentId) transaction.assignedAgentId = agentId;
            
            // [ADMIN AUDIT] Track which account was used to pay
            if (sourceAccount) {
                transaction.metadata = { ...transaction.metadata, sourceAccount };
            }

            await transaction.save({ session });

            if (status === 'rejected') {
                const user = await User.findById(transaction.userId).session(session);
                const refundAmount = Math.abs(transaction.amount) + (transaction.metadata?.feeCharged || 0);
                user.wallet.main += refundAmount;
                await user.save({ session });
            }
            return transaction;
        });

        const SocketService = require('../common/SocketService');
        const NotificationService = require('../notification/NotificationService');
        const msg = status === 'completed' ? 'আপনার উইথড্রয়াল সফল হয়েছে!' : 'আপনার উইথড্রয়াল বাতিল হয়েছে।';
        await NotificationService.send(result.userId, msg, status === 'completed' ? 'success' : 'error', { sound: status === 'completed' ? 'success' : 'error' });

        res.json({ message: 'Success', transaction: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
