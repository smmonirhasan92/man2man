const Transaction = require('./TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const ReferralService = require('../referral/ReferralService');
const TurnoverService = require('./TurnoverService');
const User = require('../user/UserModel');
const WalletService = require('./WalletService');
const mongoose = require('mongoose');
const SocketService = require('../common/SocketService');

// Get Pending Transactions (Admin)
exports.getPendingTransactions = async (req, res) => {
    try {
        const { type } = req.query;
        
        // [FIX] Auto-expire transactions older than 20 mins
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
        await Transaction.updateMany(
            { status: { $in: ['pending', 'pending_instructions', 'awaiting_payment'] }, createdAt: { $lt: twentyMinsAgo } },
            { status: 'expired' }
        );

        const query = { status: { $in: ['pending', 'pending_instructions', 'awaiting_payment', 'final_review'] } };
        if (type) query.type = type;

        const transactions = await Transaction.find(query)
            .populate('userId', 'fullName phone username')
            .sort({ createdAt: 1 });

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get ALL Transactions (Admin History)
exports.getAllTransactions = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = {};
        if (userId) query.userId = userId;

        const transactions = await Transaction.find(query)
            .populate('userId', 'fullName phone username')
            .populate('relatedUserId', 'fullName phone username') // [NEW] Audit Trail
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Assign Transaction to Agent (Admin)
exports.assignTransaction = async (req, res) => {
    try {
        const { transactionId, agentId } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.assignedAgentId) {
            return res.status(400).json({ message: 'Transaction already assigned' });
        }

        transaction.assignedAgentId = agentId;
        await transaction.save();

        // --- Emit Real-time Update to Admin Room (New Request) ---
        const SocketService = require('../common/SocketService');
        SocketService.broadcast('admin_dashboard', 'transaction_update', { 
            transactionId: transaction._id, 
            status: transaction.status,
            message: 'New Cash-out Request'
        });

        res.json({ message: 'Transaction assigned to Agent', transaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Assigned Transactions (Agent)
exports.getAssignedTransactions = async (req, res) => {
    try {
        const agentId = req.user.user.id;

        const transactions = await Transaction.find({
            $or: [
                { assignedAgentId: agentId },
                { receivedByAgentId: agentId }
            ],
            status: 'pending'
        })
            .populate('userId', 'fullName phone')
            .sort({ createdAt: 1 });

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Complete Transaction (Agent/Admin)
exports.completeTransaction = async (req, res) => {
    try {
        const { transactionId, status, comment, bonusAmount, receivedByAgentId, secKey1, secKey2, secKey3 } = req.body;
        const agentId = req.user.user.role === 'agent' ? req.user.user.id : null;

        const result = await TransactionHelper.runTransaction(async (session) => {
            const transaction = await Transaction.findById(transactionId).session(session);
            if (!transaction) throw new Error('Transaction not found');

            // Agent Ownership Check
            if (agentId) {
                const isAssigned = String(transaction.assignedAgentId) === String(agentId);
                const isReceivedBy = String(transaction.receivedByAgentId) === String(agentId);
                if (!isAssigned && !isReceivedBy) throw new Error('Transaction not assigned to you');
            }

            if (!['pending', 'awaiting_payment', 'final_review', 'pending_instructions'].includes(transaction.status)) {
                throw new Error('Transaction already processed or in invalid state');
            }

            // --- 3-LAYER SECURITY CHECK FOR SUPER ADMIN BALANCE CREATION ---
            if (req.user.user.role === 'super_admin' && status === 'completed' && ['add_money', 'recharge', 'agent_recharge'].includes(transaction.type)) {
                const validKey1 = process.env.SUPER_ADMIN_SEC_KEY_1 || '1111';
                const validKey2 = process.env.SUPER_ADMIN_SEC_KEY_2 || '2222';
                const validKey3 = process.env.SUPER_ADMIN_SEC_KEY_3 || '3333';

                if (secKey1 !== validKey1 || secKey2 !== validKey2 || secKey3 !== validKey3) {
                    throw new Error('🚨 নিরাপত্তা এলার্ট: ৩-স্তরের ভেরিফিকেশন কোড ভুল! সঠিক সিকিউরিটি কি (Key) প্রদান করুন।');
                }
            }

            transaction.status = status;
            transaction.adminComment = comment || 'Processed by System';
            if (bonusAmount) transaction.bonusAmount = parseFloat(bonusAmount);
            if (receivedByAgentId !== undefined) transaction.receivedByAgentId = receivedByAgentId || null;

            await transaction.save({ session });

            if (status === 'completed') {
                const user = await User.findById(transaction.userId).session(session);
                if (!user) throw new Error('User not found');

                // 1. Deposits (Add Money)
                if (['add_money', 'recharge', 'agent_recharge'].includes(transaction.type)) {
                    let amountToAdd = parseFloat(transaction.amount);
                    if (bonusAmount) amountToAdd += parseFloat(bonusAmount);

                    if (!user.wallet) user.wallet = { main: 0, game: 0, income: 0, purchase: 0 };
                    user.wallet.main = (user.wallet.main || 0) + amountToAdd;
                    await user.save({ session });

                    // [BINANCE-STYLE] Clear Agent Escrow
                    const sourceAgentId = transaction.receivedByAgentId;
                    if (sourceAgentId && transaction.type !== 'agent_recharge') {
                        const agent = await User.findById(sourceAgentId).session(session);
                        if (agent) {
                            const deduction = Math.abs(parseFloat(transaction.amount));
                            // Since it was already deducted from main into rechargeEscrow in requestRecharge,
                            // we just clear it from escrow here.
                            agent.wallet.rechargeEscrow = Math.max(0, (agent.wallet.rechargeEscrow || 0) - deduction);
                            await agent.save({ session });
                        }
                    }

                    // Turnover
                    await TurnoverService.addRequirement(user._id, amountToAdd, 1, session);

                    // Referral Bonus
                    if (!user.isReferralBonusPaid && user.referredBy) {
                        try {
                            await ReferralService.distributeIncome(user._id, amountToAdd, 'joining', session);
                            const referrer = await User.findOne({ referralCode: user.referredBy }).session(session);
                            if (referrer) {
                                referrer.wallet.main = (referrer.wallet.main || 0) + 20;
                                referrer.referralIncome = (referrer.referralIncome || 0) + 20;
                                await referrer.save({ session });
                                user.wallet.main += 20;
                                await Transaction.create([{
                                    userId: referrer._id,
                                    type: 'referral_bonus',
                                    amount: 20,
                                    status: 'completed',
                                    description: `Signup Bonus from ${user.username} (Verified)`
                                }, {
                                    userId: user._id,
                                    type: 'referral_bonus',
                                    amount: 20,
                                    status: 'completed',
                                    description: `Welcome Bonus (Referred by ${user.referredBy})`
                                }], { session, ordered: true });
                            }
                            user.isReferralBonusPaid = true;
                            await user.save({ session });
                        } catch (refErr) { console.error('Referral Processing Error:', refErr); }
                    }
                }

                // 2. Withdrawals
                if (['send_money', 'cash_out', 'withdraw', 'mobile_recharge'].includes(transaction.type)) {
                    const procAgentId = transaction.receivedByAgentId || transaction.assignedAgentId || agentId;
                    if (procAgentId) {
                        const agent = await User.findById(procAgentId).session(session);
                        if (agent) {
                            agent.wallet.main = (agent.wallet.main || 0) + Math.abs(parseFloat(transaction.amount));
                            await agent.save({ session });
                        }
                    }
                }
            }

            // --- HANDLING REJECTION (Refunds) ---
            if (status === 'rejected') {
                const user = await User.findById(transaction.userId).session(session);
                if (user && ['send_money', 'withdraw', 'cash_out', 'mobile_recharge', 'agent_withdraw'].includes(transaction.type)) {
                    user.wallet.main = (user.wallet.main || 0) + Math.abs(parseFloat(transaction.amount));
                    await user.save({ session });
                }

                // [BINANCE-STYLE] Refund Agent Lock
                const sourceAgentId = transaction.receivedByAgentId;
                if (sourceAgentId && ['add_money', 'recharge'].includes(transaction.type)) {
                    const agent = await User.findById(sourceAgentId).session(session);
                    if (agent) {
                        const refundAmt = Math.abs(parseFloat(transaction.amount));
                        agent.wallet.rechargeEscrow = Math.max(0, (agent.wallet.rechargeEscrow || 0) - refundAmt);
                        agent.wallet.main += refundAmt;
                        await agent.save({ session });
                        console.log(`[RECHARGE REFUND] Agent ${sourceAgentId} refunded ${refundAmt} for rejected request`);
                    }
                }
            }

            return transaction;
        });

        // --- Post-Transaction Socket / Sync ---
        try {
            const systemIo = req.app.get('systemIo');
            if (systemIo && result.userId) {
                const eventType = status === 'completed' ? 'notification' : 'notification';
                const msg = status === 'completed' ? `Transaction Approved: ${result.amount}` : `Transaction Rejected: ${result.type}`;
                systemIo.to(`user_${result.userId}`).emit(eventType, { type: status === 'completed' ? 'success' : 'error', message: msg });
                SocketService.broadcast(`user_${result.userId}`, 'transaction_update', { transactionId: result._id, status });
            }
            if (status === 'completed') SocketService.broadcast('admin_dashboard', 'transaction_update', { transactionId: result._id, status });
        } catch (syncErr) { console.error('Post-Sync Error:', syncErr); }

        res.json({ message: `Transaction processed successfully as ${status}`, transaction: result });

    } catch (err) {
        console.error('completeTransaction Error:', err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Get History (Paginated)
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const query = {
            $or: [
                { userId: userId },
                { assignedAgentId: userId },
                { receivedByAgentId: userId }
            ]
        };

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Payment Settings for Frontend
exports.getPaymentSettings = async (req, res) => {
    try {
        const SystemSetting = require('../settings/SystemSettingModel');
        const bkashSetting = await SystemSetting.findOne({ key: 'bkash_number' });
        const bankSetting = await SystemSetting.findOne({ key: 'bank_details' });

        const agents = await User.find({ 
            role: 'agent', 
            'wallet.main': { $gt: 0 },
            'agentData.isActiveForRecharge': { $ne: false }
        }, 'fullName phone _id wallet.main');

        const deposit_agents = agents.map(a => ({
            agentId: a._id,
            agentName: a.fullName,
            number: a.phone,
            availableStock: a.wallet.main
        }));

        res.json({
            bkash_number: bkashSetting ? bkashSetting.value : '01700000000',
            bank_details: bankSetting ? bankSetting.value : 'City Bank',
            deposit_agents
        });
    } catch (err) {
        console.error('getPaymentSettings Failed:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
