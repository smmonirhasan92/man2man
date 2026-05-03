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
                // [NEW] Empire Stats
                empireHands: user.empireHands || []
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
 * Claim matured commissions (after 5 days)
 */
exports.claimCommission = async (req, res) => {
    const { runTransaction } = require('../common/TransactionHelper');
    const WalletService = require('../wallet/WalletService');
    
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { transactionId } = req.body;

        const result = await runTransaction(async (session) => {
            const trx = await Transaction.findOne({
                _id: transactionId,
                userId: userId,
                status: 'locked'
            }).session(session);

            if (!trx) throw new Error("Commission not found or already claimed");

            // --- [NEW] MINIMUM PACKAGE CHECK ---
            const UserPlanForClaim = require('../plan/UserPlanModel');
            const PlanForClaim = require('../admin/PlanModel');
            
            const userPlans = await UserPlanForClaim.find({ userId }).session(session);
            let hasMinPackage = false;
            
            if (userPlans.length > 0) {
                const planIds = userPlans.map(p => p.planId);
                const plans = await PlanForClaim.find({ _id: { $in: planIds }, unlock_price: { $gte: 500 } }).session(session);
                if (plans.length > 0) {
                    hasMinPackage = true;
                }
            }

            if (!hasMinPackage) {
                throw new Error("বোনাস ক্লেইম করার জন্য আপনাকে অন্তত ৫০০ NXS ($5) মূল্যের একটি প্যাকেজ কিনতে হবে।");
            }

            if (!trx.metadata.releaseDate) {
                 throw new Error("Validation Guard: You must have an active package with >10 days validity to unlock this commission.");
            }

            const releaseDate = new Date(trx.metadata.releaseDate);
            if (releaseDate > new Date()) {
                throw new Error(`Commission is locked until ${releaseDate.toLocaleDateString()}`);
            }

            const user = await User.findById(userId).session(session);
            
            // Move funds
            const amount = trx.amount;
            user.wallet.pending_referral = Math.max(0, (user.wallet.pending_referral || 0) - amount);
            user.wallet.income = (user.wallet.income || 0) + amount;
            user.referralIncome = (user.referralIncome || 0) + amount;

            trx.status = 'completed';
            
            await user.save({ session });
            await trx.save({ session });

            return { success: true, amount };
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
