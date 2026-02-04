const Transaction = require('./TransactionModel');
const User = require('../user/UserModel');
const WalletService = require('./WalletService');
const mongoose = require('mongoose');
const ReferralService = require('../referral/ReferralService');

// Get Pending Transactions (Admin)
exports.getPendingTransactions = async (req, res) => {
    try {
        const { type } = req.query;
        const query = { status: 'pending' };
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
            .populate('userId', 'fullName phone')
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
// Complete Transaction (Agent/Admin)
exports.completeTransaction = async (req, res) => {
    try {
        const { transactionId, status, comment, bonusAmount, receivedByAgentId } = req.body;
        const agentId = req.user.user.role === 'agent' ? req.user.user.id : null;

        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Agent Ownership Check
        if (agentId) {
            const isAssigned = String(transaction.assignedAgentId) === String(agentId);
            const isReceivedBy = String(transaction.receivedByAgentId) === String(agentId);
            if (!isAssigned && !isReceivedBy) {
                return res.status(403).json({ message: 'Transaction not assigned to you' });
            }
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ message: 'Transaction already processed' });
        }

        transaction.status = status;
        transaction.adminComment = comment || 'Processed by System';

        if (bonusAmount) transaction.bonusAmount = parseFloat(bonusAmount);

        if (receivedByAgentId !== undefined) {
            transaction.receivedByAgentId = receivedByAgentId || null;
        } else if (agentId) {
            transaction.receivedByAgentId = agentId;
        }

        await transaction.save();

        // --- HANDLING COMPLETION ---
        if (status === 'completed') {
            const user = await User.findById(transaction.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            // 1. Deposits (Add Money)
            if (['add_money', 'recharge', 'agent_recharge'].includes(transaction.type)) {
                let amountToAdd = parseFloat(transaction.amount);
                if (bonusAmount) amountToAdd += parseFloat(bonusAmount);

                // Check structure and init if missing (legacy support)
                if (!user.wallet) user.wallet = { main: 0, game: 0, income: 0, purchase: 0 };

                user.wallet.main = (user.wallet.main || 0) + amountToAdd;
                await user.save();

                // Deduct Agent Stock 
                const sourceAgentId = transaction.receivedByAgentId || (agentId || null);
                if (sourceAgentId && transaction.type !== 'agent_recharge') {
                    const agent = await User.findById(sourceAgentId);
                    if (!agent) throw new Error('Agent not found');

                    if ((agent.wallet.main || 0) < parseFloat(transaction.amount)) {
                        throw new Error(`Insufficient Agent Stock`);
                    }
                    agent.wallet.main -= parseFloat(transaction.amount);
                    await agent.save();
                }

                try {
                    const systemIo = req.app.get('systemIo');
                    if (systemIo) {
                        systemIo.to(`user_${user._id}`).emit('balance_update', user.wallet.main);
                    }
                } catch (notifyErr) {
                    console.error('[Notification Error] Failed to emit balance update:', notifyErr.message);
                }

                // [REDIS] Invalidate Profile Cache
                const { client } = require('../../config/redis');
                if (client.isOpen) await client.del(`user_profile:${user._id}`);

                // [REFERRAL ENGINE INTEGRATION]
                // 1. Joining Bonus (Type A)
                if (!user.isReferralBonusPaid && user.referredBy) {
                    // console.log(`[Transaction] First Deposit detected. Triggering Joining Bonus.`);
                    await ReferralService.distributeIncome(user._id, amountToAdd, 'joining');
                    user.isReferralBonusPaid = true;
                    await user.save();
                }
                // [NEW] TURNOVER INTEGRATION
                // Add 1x Turnover Requirement for Deposit
                const TurnoverService = require('./TurnoverService');
                await TurnoverService.addRequirement(user._id, amountToAdd, 1);
            }

            // 2. Withdrawals
            if (['send_money', 'cash_out', 'withdraw', 'mobile_recharge'].includes(transaction.type)) {
                const processingAgentId = transaction.receivedByAgentId || transaction.assignedAgentId || agentId;
                if (processingAgentId) {
                    const agent = await User.findById(processingAgentId);
                    if (agent) {
                        const reimbursement = Math.abs(parseFloat(transaction.amount));
                        agent.wallet.main = (agent.wallet.main || 0) + reimbursement;
                        await agent.save();
                    }
                }
            }

            // 3. Commission Logic (Legacy Removed - Replaced by Engine if needed)
            // If this transaction represents a "Task", the Controller for Task should call ReferralService.
            // For simple transfers, we might not want the legacy commission Logic.
            // commenting out legacy 1-level commission to avoid double pay if Engine is used.
            /*
            const activeAgentId = transaction.receivedByAgentId || transaction.assignedAgentId;
            if (activeAgentId) { ... } 
            */
        }

        // --- HANDLING REJECTION (Refunds) ---
        if (status === 'rejected') {
            if (['send_money', 'withdraw', 'cash_out', 'mobile_recharge', 'agent_withdraw'].includes(transaction.type)) {
                const refundAmount = Math.abs(parseFloat(transaction.amount));
                const user = await User.findById(transaction.userId);
                if (user) {
                    user.wallet.main = (user.wallet.main || 0) + refundAmount;
                    await user.save();
                }
            }
        }

        res.json({ message: 'Transaction processed successfully', status: status });

    } catch (err) {
        console.error('Transaction Error:', err);
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
// Get Payment Settings for Frontend
exports.getPaymentSettings = async (req, res) => {
    try {
        console.log('[DEBUG] getPaymentSettings Called');

        console.log('[DEBUG] Requiring SystemSettingModel...');
        const SystemSetting = require('../settings/SystemSettingModel');
        console.log('[DEBUG] SystemSetting Model:', SystemSetting);

        console.log('[DEBUG] Querying bkash_number...');
        const bkashSetting = await SystemSetting.findOne({ key: 'bkash_number' });
        console.log('[DEBUG] bkashSetting:', bkashSetting);

        console.log('[DEBUG] Querying bank_details...');
        const bankSetting = await SystemSetting.findOne({ key: 'bank_details' });
        console.log('[DEBUG] bankSetting:', bankSetting);

        console.log('[DEBUG] Finding Agents...');
        const agents = await User.find({ role: 'agent' }, 'fullName phone _id');

        const deposit_agents = agents.map(a => ({
            agentId: a._id,
            agentName: a.fullName,
            number: a.phone
        }));

        res.json({
            bkash_number: bkashSetting ? bkashSetting.value : '01700000000',
            bank_details: bankSetting ? bankSetting.value : 'City Bank',
            deposit_agents
        });
    } catch (err) {
        console.error('[CRITICAL ERROR] getPaymentSettings Failed:', err);
        res.status(500).json({ message: 'Server Error', error: err.toString() });
    }
};
