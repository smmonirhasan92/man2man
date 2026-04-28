const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');

/**
 * Get basic stats and logs for the dashboard
 */
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch recent logs
        const logs = await Transaction.find({ 
            userId: user._id, 
            type: 'referral_commission' 
        }).sort({ createdAt: -1 }).limit(20);

        // Calculate hand progress
        const HAND_SIZE = 5;
        const referralCount = user.referralCount || 0;
        const progressInHand = referralCount % HAND_SIZE;
        const remainingForHand = HAND_SIZE - progressInHand;

        res.json({
            stats: {
                totalEarnings: user.referralIncome || 0,
                totalReferrals: user.referralCount || 0,
                activeReferrals: user.referralCount || 0,
                referralHands: user.referralHands || 0,
                handProgress: progressInHand,
                remainingForHand: remainingForHand,
                balance: user.wallet.income,
                // [NEW] Empire Stats
                empireHands: user.empireHands || []
            },
            logs: logs,
            referralCode: user.referralCode
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Get members at a specific level in the network
 */
exports.getNetworkMembers = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { level = 1 } = req.query;
        const targetLevel = parseInt(level);
        const user = await User.findById(userId);

        if (!user || !user.referralCode) return res.json([]);

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
        
        // Normalize for UI
        const normalized = members.map(m => ({
            _id: m._id,
            username: m.username,
            fullName: m.fullName,
            status: m.status,
            joinedAt: m.createdAt,
            commission: 0 
        }));

        res.json(normalized);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Placeholder for leaderboard
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.find({ role: 'user' })
            .sort({ referralCount: -1 })
            .limit(10)
            .select('username referralCount referralIncome');
        res.json(topUsers);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};
