const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');

/**
 * Get basic stats and logs for the dashboard
 */
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        // Calculate hand progress (Old system - keeping for compatibility)
        const HAND_SIZE = 5;
        const referralCount = user.referralCount || 0;
        const progressInHand = referralCount % HAND_SIZE;
        const remainingForHand = HAND_SIZE - progressInHand;

        // [UX PHASE] 20-Referral Empire Progress (Big Packages / Tour Sales)
        const empireGoal = 20;
        const empireProgress = Math.min(user.tourSales || 0, empireGoal);
        const empirePercentage = (empireProgress / empireGoal) * 100;

        // Fetch Locked Commissions for Profile
        const lockedCommissions = await Transaction.find({
            userId: user._id,
            type: 'referral_commission',
            status: 'locked'
        }).sort({ createdAt: -1 });

        res.json({
            stats: {
                totalEarnings: (user.referralIncome || 0) + (user.wallet.pending_referral || 0),
                totalReferrals: user.referralCount || 0,
                activeReferrals: user.referralCount || 0,
                referralHands: user.referralHands || 0,
                handProgress: progressInHand,
                remainingForHand: remainingForHand,
                balance: user.wallet.income,
                pendingReferral: user.wallet.pending_referral || 0,
                empireProgress,
                empireGoal,
                empirePercentage,
                // [NEW] 3-Tier Empire Stats
                monthlySprint: user.monthlySprint || { currentMonth: '', directsCount: 0, volume: 0, bonusClaimed: false },
                directEmpire: user.directEmpire || { goldMembers: [], totalCount: 0, isMatured: false },
                teamEmpire: user.teamEmpire || { completedTeams: 0, currentTeamMembers: [] }
            },
            lockedCommissions,
            logs: [],
            referralCode: user.referralCode || user.username?.toUpperCase() || 'MEMBER'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Claim a single referral commission — No locks, no conditions.
 * User can claim any time they want → goes to wallet.income
 */
exports.claimCommission = async (req, res) => {
    const { runTransaction } = require('../common/TransactionHelper');

    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { transactionId } = req.body;

        const result = await runTransaction(async (session) => {
            // Only check: does this locked tx belong to this user?
            const trx = await Transaction.findOne({
                _id: transactionId,
                userId: userId,
                status: 'locked'
            }).session(session);

            if (!trx) throw new Error("Commission not found or already claimed.");

            const amount = trx.amount;
            if (!amount || amount <= 0) throw new Error("Invalid commission amount.");

            // Atomic: deduct pending_referral, credit income
            const user = await User.findOneAndUpdate(
                { _id: userId, 'wallet.pending_referral': { $gte: amount } },
                {
                    $inc: {
                        'wallet.pending_referral': -amount,
                        'wallet.income': amount,
                        referralIncome: amount
                    }
                },
                { new: true, session }
            );

            if (!user) throw new Error("Insufficient pending balance. Please refresh and try again.");

            trx.status = 'completed';
            await trx.save({ session });

            // [SOCKET] Real-time wallet update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(userId, 'wallet_update', {
                    income: user.wallet.income,
                    pending_referral: user.wallet.pending_referral,
                    main: user.wallet.main
                });
            } catch (e) {}

            return { success: true, amount, newIncomeBalance: user.wallet.income };
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

/**
 * Claim ALL pending referral commissions at once
 */
exports.claimAllCommissions = async (req, res) => {
    const { runTransaction } = require('../common/TransactionHelper');

    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);

        const result = await runTransaction(async (session) => {
            // Find all locked commissions for this user
            const lockedTrxs = await Transaction.find({
                userId: userId,
                type: 'referral_commission',
                status: 'locked'
            }).session(session);

            if (!lockedTrxs.length) throw new Error("No pending commissions to claim.");

            const totalAmount = lockedTrxs.reduce((sum, t) => sum + (t.amount || 0), 0);
            if (totalAmount <= 0) throw new Error("Total claim amount is zero.");

            // Atomic: move all from pending_referral → income
            const user = await User.findOneAndUpdate(
                { _id: userId, 'wallet.pending_referral': { $gte: totalAmount } },
                {
                    $inc: {
                        'wallet.pending_referral': -totalAmount,
                        'wallet.income': totalAmount,
                        referralIncome: totalAmount
                    }
                },
                { new: true, session }
            );

            if (!user) throw new Error("Balance mismatch. Please refresh and try again.");

            // Mark all as completed
            await Transaction.updateMany(
                { _id: { $in: lockedTrxs.map(t => t._id) } },
                { $set: { status: 'completed' } },
                { session }
            );

            // [SOCKET]
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(userId, 'wallet_update', {
                    income: user.wallet.income,
                    pending_referral: user.wallet.pending_referral,
                    main: user.wallet.main
                });
            } catch (e) {}

            return {
                success: true,
                totalClaimed: totalAmount,
                count: lockedTrxs.length,
                newIncomeBalance: user.wallet.income
            };
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

/**
 * Get members at a specific level in the network
 */
exports.getNetworkMembers = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { level = 1 } = req.query;
        const targetLevel = parseInt(level);
        const user = await User.findById(userId);

        if (!user || !user.referralCode || user.referralCode.trim() === '') return res.json([]);

        // recursive fetch based on level
        const getReferralsAtLevel = async (codes, currentDepth) => {
            if (currentDepth === targetLevel) {
                return await User.find({ referredBy: { $in: codes } })
                    .select('username fullName status createdAt referralCount wallet.income referralIncome');
            }
            
            const usersAtThisLevel = await User.find({ referredBy: { $in: codes } }).select('referralCode');
            const nextCodes = usersAtThisLevel.map(u => u.referralCode).filter(c => c);
            
            if (nextCodes.length === 0) return [];
            return await getReferralsAtLevel(nextCodes, currentDepth + 1);
        };

        const members = await getReferralsAtLevel([user.referralCode], 1);
        
        // [FIX] Fetch actual commission earned FROM each member
        const memberIds = members.map(m => m._id);
        const commissions = await Transaction.aggregate([
            {
                $match: {
                    userId: user._id,
                    type: 'referral_commission',
                    'metadata.sourceUser': { $in: memberIds }
                }
            },
            {
                $group: {
                    _id: '$metadata.sourceUser',
                    totalCommission: { $sum: '$amount' }
                }
            }
        ]);

        // Build a fast lookup map: sourceUser => totalCommission
        const commissionMap = {};
        commissions.forEach(c => {
            commissionMap[c._id.toString()] = c.totalCommission;
        });

        // Normalize for UI — now with REAL commission per member
        const normalized = members.map(m => ({
            _id: m._id,
            username: m.username,
            fullName: m.fullName,
            status: m.status,
            joinedAt: m.createdAt,
            referralCount: m.referralCount || 0,
            commission: commissionMap[m._id.toString()] || 0
        }));

        res.json(normalized);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * [LIVE RACE] Get referral leaderboard sorted by TOTAL EARNINGS (Income + Pending)
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.aggregate([
            { $match: { role: 'user', status: 'active' } },
            {
                $addFields: {
                    totalEarnings: { 
                        $add: [
                            { $ifNull: ["$referralIncome", 0] }, 
                            { $ifNull: ["$wallet.pending_referral", 0] }
                        ] 
                    }
                }
            },
            { $match: { totalEarnings: { $gt: 0 } } }, // Only show those who earned something
            { $sort: { totalEarnings: -1, referralCount: -1 } },
            { $limit: 20 },
            {
                $project: {
                    username: 1,
                    referralCount: 1,
                    referralIncome: "$totalEarnings", // Map total potential to the UI field
                    totalSales: "$referralCount" // For UI label consistency
                }
            }
        ]);
        res.json(topUsers);
    } catch (err) {
        console.error("Leaderboard Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * [NEW] Get Detailed Referral Commission History
 * Allows users to track exactly who gave them how much commission.
 */
exports.getReferralHistory = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        
        // Fetch only referral commissions for this user
        const history = await Transaction.find({
            userId: userId,
            type: 'referral_commission'
        })
        .sort({ createdAt: -1 })
        .limit(100) // Keep it performant
        .lean();

        // Format the response for the frontend
        const formattedHistory = history.map(tx => ({
            id: tx._id,
            amount: tx.amount,
            status: tx.status, // e.g., 'locked', 'completed'
            description: tx.description, // Contains the username (e.g., "L1 Commission from USER123")
            date: tx.createdAt,
            level: tx.metadata?.level || 'N/A',
            sourceUser: tx.metadata?.sourceUser || null
        }));

        res.json({ success: true, history: formattedHistory });
    } catch (err) {
        console.error("[ReferralHistory Error]", err);
        res.status(500).json({ success: false, message: "Failed to fetch referral history" });
    }
};
