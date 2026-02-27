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

        // --- 3-LAYER SECURITY CHECK FOR SUPER ADMIN BALANCE CREATION ---
        if (req.user.user.role === 'super_admin' && status === 'completed' && ['add_money', 'recharge', 'agent_recharge'].includes(transaction.type)) {
            const { secKey1, secKey2, secKey3 } = req.body;

            // Validate presence
            if (!secKey1 || !secKey2 || !secKey3) {
                return res.status(403).json({ message: 'SECURITY ALERT: 3-Layer Verification Required to generate balance. Keys missing.' });
            }

            // Validate against .env secrets or defaults
            const validKey1 = process.env.SUPER_ADMIN_SEC_KEY_1 || '1234';
            const validKey2 = process.env.SUPER_ADMIN_SEC_KEY_2 || '2314';
            const validKey3 = process.env.SUPER_ADMIN_SEC_KEY_3 || '3124';

            if (secKey1 !== validKey1 || secKey2 !== validKey2 || secKey3 !== validKey3) {
                return res.status(403).json({ message: 'SECURITY ALERT: 3-Layer Verification Failed! Unauthorized access attempt.' });
            }
        }
        // --- END 3-LAYER SECURITY CHECK ---

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
                        // [NEW] Trigger Global Notification Toast
                        systemIo.to(`user_${user._id}`).emit('notification', {
                            type: 'success',
                            message: `Deposit Approved: ${amountToAdd} NXS`
                        });
                        // [NEW] Trigger Context Wallet Refund Toast
                        systemIo.to(`user_${user._id}`).emit('wallet:update', {
                            type: 'deposit_received',
                            amount: amountToAdd
                        });
                    }
                } catch (notifyErr) {
                    console.error('[Notification Error] Failed to emit balance update:', notifyErr.message);
                }

                // [REDIS] Invalidate Profile Cache
                const { client } = require('../../config/redis');
                if (client.isOpen) await client.del(`user_profile:${user._id}`);

                // [REFERRAL ENGINE INTEGRATION]
                // 1. Joining Bonus (Type A) + Fixed 20 Unit Main Wallet Bonus
                if (!user.isReferralBonusPaid && user.referredBy) {
                    // Dynamic MLM Commission
                    await ReferralService.distributeIncome(user._id, amountToAdd, 'joining');

                    // [NEW] 20 Unit Fixed Referral Bonus to Main Wallet (Replacing Auth Instant Bonus)
                    const referrerDoc = await User.findOne({ referralCode: user.referredBy });
                    if (referrerDoc) {
                        referrerDoc.wallet.main = (referrerDoc.wallet.main || 0) + 20.00;
                        // referrerDoc.referralCount = (referrerDoc.referralCount || 0) + 1; // It increments during registration to show 'Pending' referrals
                        referrerDoc.referralIncome = (referrerDoc.referralIncome || 0) + 20.00;
                        await referrerDoc.save();

                        // Give New User their 20 Unit Welcome Bonus
                        user.wallet.main = (user.wallet.main || 0) + 20.00;

                        // Create Logs
                        await Transaction.create([{
                            userId: referrerDoc._id,
                            type: 'referral_bonus',
                            amount: 20.00,
                            status: 'completed',
                            description: `Signup Bonus from ${user.username || 'User'} (Deposit Verified)`,
                            balanceAfter: referrerDoc.wallet.main
                        }, {
                            userId: user._id,
                            type: 'referral_bonus',
                            amount: 20.00,
                            status: 'completed',
                            description: `Welcome Bonus (Referred by ${user.referredBy})`,
                            balanceAfter: user.wallet.main
                        }]);
                    }

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
        }

        // --- HANDLING REJECTION (Refunds) ---
        if (status === 'rejected') {
            const user = await User.findById(transaction.userId);
            if (['send_money', 'withdraw', 'cash_out', 'mobile_recharge', 'agent_withdraw'].includes(transaction.type)) {
                const refundAmount = Math.abs(parseFloat(transaction.amount));
                if (user) {
                    user.wallet.main = (user.wallet.main || 0) + refundAmount;
                    await user.save();
                }
            }

            try {
                const systemIo = req.app.get('systemIo');
                if (systemIo && user) {
                    systemIo.to(`user_${user._id}`).emit('notification', {
                        type: 'error',
                        message: `Transaction Rejected: ${transaction.type}`
                    });
                }
            } catch (e) { console.error(e); }
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
exports.getPaymentSettings = async (req, res) => {
    try {
        const SystemSetting = require('../settings/SystemSettingModel');
        const bkashSetting = await SystemSetting.findOne({ key: 'bkash_number' });
        const bankSetting = await SystemSetting.findOne({ key: 'bank_details' });

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
        console.error('getPaymentSettings Failed:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
