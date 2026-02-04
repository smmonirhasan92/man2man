const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create Agent
exports.createAgent = async (req, res) => {
    try {
        const { fullName, phone, password, commissionRate } = req.body;

        let user = await User.findOne({ phone });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const username = fullName.split(' ')[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            fullName,
            phone,
            username,
            country: 'Bangladesh',
            password: hashedPassword,
            role: 'agent',
            commissionRate: commissionRate || 0.00,
            kycStatus: 'approved'
        });

        // Initialize wallet
        user.wallet = { main: 0, game: 0, purchase: 0, income: 0, bonus: 0 };

        await user.save();
        res.status(201).json({ message: 'Agent created successfully', agent: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Agents with Stats
exports.getAgents = async (req, res) => {
    try {
        // Find all agents
        const agents = await User.find({ role: 'agent' }, '-password');

        // For each agent, aggregate stats. 
        // Note: For large datasets, this N+1 should be replaced with a single aggregation on Transactions grouped by AgentID.
        // For now, let's keep it simpler or do a Promise.all
        const agentsWithStats = await Promise.all(agents.map(async (agent) => {
            const agentId = agent._id;

            const totalEarnings = await Transaction.aggregate([
                { $match: { userId: agentId, type: 'commission', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const totalDeposits = await Transaction.aggregate([
                { $match: { receivedByAgentId: agentId, type: { $in: ['add_money', 'recharge'] }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const totalWithdraws = await Transaction.aggregate([
                {
                    $match: {
                        $or: [{ receivedByAgentId: agentId }, { assignedAgentId: agentId }],
                        type: { $in: ['withdraw', 'send_money', 'cash_out'] },
                        status: 'completed'
                    }
                },
                { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
            ]);

            return {
                ...agent.toObject(),
                totalEarnings: totalEarnings[0] ? totalEarnings[0].total : 0,
                totalDeposits: totalDeposits[0] ? totalDeposits[0].total : 0,
                totalWithdraws: totalWithdraws[0] ? totalWithdraws[0].total : 0,
                balance: agent.wallet ? agent.wallet.main : 0
            };
        }));

        res.json(agentsWithStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Agent Commission
exports.updateAgentCommission = async (req, res) => {
    try {
        const { agentId, commissionRate } = req.body;
        const agent = await User.findById(agentId);
        if (!agent) return res.status(404).json({ message: 'Agent not found' });

        agent.commissionRate = commissionRate;
        await agent.save();
        res.json({ message: 'Commission updated', agent });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Verify Agent
exports.verifyAgent = async (req, res) => {
    try {
        const { userId, status } = req.body;
        const user = await User.findByIdAndUpdate(userId, { kycStatus: status }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: `Agent KYC ${status}`, user });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Adjust Balance
exports.adjustBalance = async (req, res) => {
    const TransactionHelper = require('../modules/common/TransactionHelper');
    try {
        await TransactionHelper.runTransaction(async (session) => {
            const opts = session ? { session } : {};
            const { agentId, type, amount, note } = req.body;
            const agent = await User.findById(agentId).setOptions(opts);

            if (!agent) throw new Error('Agent not found');

            const adj = parseFloat(amount);
            if (isNaN(adj) || adj <= 0) throw new Error('Invalid amount');

            if (type === 'debit') {
                if (agent.wallet.main < adj) throw new Error('Insufficient balance');
                agent.wallet.main -= adj;
            } else if (type === 'credit') {
                agent.wallet.main += adj;
            } else {
                throw new Error('Invalid type');
            }

            await agent.save(opts);

            await new Transaction({
                userId: agentId,
                type: type === 'credit' ? 'admin_credit' : 'admin_debit',
                amount: type === 'debit' ? -adj : adj,
                status: 'completed',
                adminComment: note || 'Admin Adjustment',
                recipientDetails: `Admin ${type} adjustment`
            }).save(opts);
        });
        res.json({ message: 'Balance adjusted' });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Get Settlement Stats (For Agent Dashboard)
exports.getSettlementStats = async (req, res) => {
    try {
        const agentId = req.user.user.id;
        const agent = await User.findById(agentId);
        if (!agent) return res.status(404).json({ message: 'Agent not found' });

        // Calculate Total Earnings
        const totalEarnings = await Transaction.aggregate([
            { $match: { userId: agent._id, type: 'commission', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            currentBalance: (agent.wallet.agent || 0).toFixed(2), // Show Stock Balance
            personalBalance: agent.wallet.main.toFixed(2),
            totalEarnings: totalEarnings[0] ? totalEarnings[0].total : 0,
            totalDue: 0.00
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Request Topup
exports.requestTopup = async (req, res) => {
    try {
        const { amount, method, transactionId, note } = req.body;
        const agentId = req.user.user.id;

        const transaction = await Transaction.create({
            userId: agentId,
            type: 'agent_recharge',
            amount: parseFloat(amount),
            status: 'pending',
            recipientDetails: `Request Load via ${method} (TrxID: ${transactionId})`,
            description: note || 'Agent Stock Request'
        });

        res.json({ message: 'Topup request sent', transaction });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Request Withdraw
exports.requestWithdraw = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount, method, accountDetails } = req.body;
        const agentId = req.user.user.id;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Invalid Amount');

        const agent = await User.findById(agentId).session(session);
        if (!agent) throw new Error('Agent not found');

        if ((agent.wallet.agent || 0) < parsedAmount) {
            throw new Error('Insufficient Stock Balance');
        }

        agent.wallet.agent = (agent.wallet.agent || 0) - parsedAmount;
        await agent.save({ session });

        const transaction = await new Transaction({
            userId: agentId,
            type: 'agent_withdraw',
            amount: -parsedAmount,
            status: 'pending',
            recipientDetails: `${method}: ${accountDetails}`,
            description: 'Agent Stock Withdrawal'
        }).save({ session });

        await session.commitTransaction();
        res.json({ message: 'Withdrawal request sent', transaction, newBalance: agent.wallet.main });

    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message || 'Server Error' });
    } finally {
        session.endSession();
    }
};
