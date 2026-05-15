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
        
        // [FIX] Auto-expire transactions
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
        const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);

        // 1. Expire non-withdrawal transactions after 20 mins
        await Transaction.updateMany(
            { 
                type: { $ne: 'cash_out' },
                status: { $in: ['pending', 'pending_instructions', 'awaiting_payment'] }, 
                createdAt: { $lt: twentyMinsAgo } 
            },
            { status: 'expired' }
        );

        // 2. Expire withdrawal transactions after 3 hours
        await Transaction.updateMany(
            { 
                type: 'cash_out',
                status: { $in: ['pending', 'pending_instructions', 'awaiting_payment'] }, 
                createdAt: { $lt: threeHoursAgo } 
            },
            { status: 'expired' }
        );

        const query = { 
            status: { $in: ['pending', 'pending_instructions', 'awaiting_payment', 'final_review'] },
            type: { $ne: 'fee' }
        };
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
        const { userId, types } = req.query;
        const query = {};
        if (userId) query.userId = userId;
        if (types) {
            query.type = { $in: types.split(',') };
        }

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
            const transaction = await Transaction.findOneAndUpdate(
                {
                    _id: transactionId,
                    status: { $in: ['pending', 'awaiting_payment', 'final_review', 'pending_instructions'] }
                },
                {
                    $set: {
                        status: status,
                        adminComment: comment || 'Processed by System',
                        ...(bonusAmount && { bonusAmount: parseFloat(bonusAmount) }),
                        ...(receivedByAgentId !== undefined && { receivedByAgentId: receivedByAgentId || null })
                    }
                },
                { session, new: true }
            );

            if (!transaction) {
                throw new Error('Transaction not found or already processed');
            }

            // Agent Ownership Check
            if (agentId) {
                const isAssigned = String(transaction.assignedAgentId) === String(agentId);
                const isReceivedBy = String(transaction.receivedByAgentId) === String(agentId);
                if (!isAssigned && !isReceivedBy) throw new Error('Transaction not assigned to you');
            }

            // --- 3-LAYER SECURITY CHECK FOR SUPER ADMIN BALANCE CREATION ---
            if (req.user.user.role === 'super_admin' && status === 'completed' && ['add_money', 'recharge', 'agent_recharge'].includes(transaction.type)) {
                const validKey1 = process.env.SUPER_ADMIN_SEC_KEY_1 || '1111';
                const validKey2 = process.env.SUPER_ADMIN_SEC_KEY_2 || '2222';
                const validKey3 = process.env.SUPER_ADMIN_SEC_KEY_3 || '3333';

                if (secKey1 !== validKey1 || secKey2 !== validKey2 || secKey3 !== validKey3) {
                    throw new Error('🚨 Security Alert: 3-layer verification code incorrect! Please provide the correct Security Key.');
                }
            }

            if (status === 'completed') {
                const user = await User.findById(transaction.userId).session(session);
                if (!user) throw new Error('User not found');

                // 1. Deposits (Add Money)
                if (['add_money', 'recharge', 'agent_recharge'].includes(transaction.type)) {
                    let amountToAdd = parseFloat(transaction.amount);
                    let feeAmount = 0;
                    
                    // --- 3.5% ADMIN DEPOSIT FEE ---
                    if (['add_money', 'recharge'].includes(transaction.type)) {
                        feeAmount = amountToAdd * 0.035;
                        amountToAdd = amountToAdd - feeAmount;
                    }

                    if (bonusAmount) {
                        const parsedBonus = parseFloat(bonusAmount);
                        if (parsedBonus > amountToAdd * 2) {
                            throw new Error(`Security Alert: Bonus amount (${parsedBonus}) is unusually high compared to deposit! (Max allowed: 200%)`);
                        }
                        amountToAdd += parsedBonus;
                    }

                    const dbUser = await User.findOneAndUpdate(
                        { _id: transaction.userId },
                        { $inc: { 'wallet.main': amountToAdd } },
                        { new: true, session }
                    );

                    // Ensure defaults if missing
                    if (!dbUser.wallet) {
                        dbUser.wallet = { main: amountToAdd, game: 0, income: 0, purchase: 0 };
                        await dbUser.save({ session });
                    }

                    // Update local user reference for subsequent checks
                    user.wallet.main = dbUser.wallet.main;

                    // Log Fee Transaction
                    if (feeAmount > 0) {
                        await Transaction.create([{
                            userId: transaction.userId,
                            type: 'fee',
                            amount: -feeAmount,
                            status: 'completed',
                            description: `Admin Deposit Platform Fee (3.5%)`,
                            recipientDetails: 'System',
                            metadata: { relatedTrxId: transaction._id }
                        }], { session, ordered: true });
                        
                        // Add the collected fee to Admin Reserve
                        const SystemSetting = require('../settings/SystemSettingModel');
                        await SystemSetting.findOneAndUpdate(
                            { key: 'admin_reserve_fund' },
                            { $inc: { value: feeAmount } },
                            { upsert: true, session }
                        );
                    }

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
                        await User.findOneAndUpdate(
                            { _id: procAgentId },
                            { $inc: { 'wallet.main': Math.abs(parseFloat(transaction.amount)) } },
                            { session }
                        );
                    }
                }
            }

            // --- HANDLING REJECTION (Refunds) ---
            if (status === 'rejected') {
                if (['send_money', 'withdraw', 'cash_out', 'mobile_recharge', 'agent_withdraw'].includes(transaction.type)) {
                    await User.findOneAndUpdate(
                        { _id: transaction.userId },
                        { $inc: { 'wallet.main': Math.abs(parseFloat(transaction.amount)) } },
                        { session }
                    );
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
                
                // [SPEED FIX] Push exact wallet balance immediately to avoid extra frontend HTTP requests
                const updatedUser = await User.findById(result.userId).select('wallet');
                if (updatedUser && updatedUser.wallet) {
                    systemIo.to(`user_${result.userId}`).emit('wallet_sync', { wallet: updatedUser.wallet });
                }
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
