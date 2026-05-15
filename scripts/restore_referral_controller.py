
import os

file_path = '/var/www/man2man/backend/modules/referral/ReferralController.js'

content = """const ReferralService = require('./ReferralService');
const User = require('../user/UserModel');
const Transaction = require('../transaction/TransactionModel');
const { runTransaction } = require('../../utils/transactionHelper');
const Plan = require('../admin/PlanModel');
const UserPlan = require('../plan/UserPlanModel');

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const user = await User.findById(userId).select('referralCode referralCount referralIncome wallet referralEmpire');
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        const shareGoal = 100;
        const shareProgress = Math.min((user.referralEmpire?.sharesCount || 0) / shareGoal * 100, 100);

        const joinGoal = 100;
        const joinProgress = Math.min((user.referralCount || 0) / joinGoal * 100, 100);

        res.json({
            referralCode: user.referralCode,
            totalReferrals: user.referralCount || 0,
            totalEarnings: user.referralIncome || 0,
            pendingEarnings: user.wallet?.pending_referral || 0,
            empire: {
                shares: user.referralEmpire?.sharesCount || 0,
                holdBalance: user.referralEmpire?.holdBalance || 0,
                shareProgress,
                joinProgress,
                isShareBonusClaimed: user.referralEmpire?.isShareBonusClaimed || false,
                isJoinBonusClaimed: user.referralEmpire?.isJoinBonusClaimed || false
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.handleShare = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await ReferralService.trackShare(userId, ip);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.recordHandshake = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (!referralCode) return res.status(400).json({ message: 'Referral code required' });
        await ReferralService.recordHandshake(ip, referralCode);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getHandshake = async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const referralCode = await ReferralService.getHandshake(ip);
        res.json({ referralCode });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.claimCommission = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { transactionId } = req.body;

        const result = await runTransaction(async (session) => {
            const trx = await Transaction.findOne({
                _id: transactionId,
                userId: userId,
                type: 'referral_commission',
                status: 'locked'
            }).session(session);

            if (!trx) throw new Error("Commission not found or already claimed");

            const userPlans = await UserPlan.find({ userId }).session(session);
            let hasMinPackage = false;
            if (userPlans.length > 0) {
                const planIds = userPlans.map(p => p.planId);
                const plans = await Plan.find({ _id: { $in: planIds }, unlock_price: { $gte: 500 } }).session(session);
                if (plans.length > 0) hasMinPackage = true;
            }

            if (!hasMinPackage) throw new Error("বোনাস ক্লেইম করার জন্য আপনাকে অন্তত ৫০০ NXS ($5) মূল্যের একটি প্যাকেজ কিনতে হবে।");

            if (trx.metadata?.releaseDate && new Date(trx.metadata.releaseDate) > new Date()) {
                throw new Error("Commission is still locked.");
            }

            const user = await User.findById(userId).session(session);
            const amount = trx.amount;
            user.wallet.pending_referral = Math.max(0, (user.wallet.pending_referral || 0) - amount);
            user.wallet.income += amount;
            user.referralIncome += amount;
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

exports.getNetworkMembers = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { level = 1 } = req.query;
        const targetLevel = parseInt(level);
        const user = await User.findById(userId);
        if (!user || !user.referralCode) return res.json([]);

        const getReferralsAtLevel = async (codes, currentDepth) => {
            if (currentDepth === targetLevel) {
                return await User.find({ referredBy: { $in: codes } }).select('username fullName status createdAt referralCount');
            }
            const usersAtThisLevel = await User.find({ referredBy: { $in: codes } }).select('referralCode');
            const nextCodes = usersAtThisLevel.map(u => u.referralCode).filter(c => c);
            if (nextCodes.length === 0) return [];
            return await getReferralsAtLevel(nextCodes, currentDepth + 1);
        };

        const members = await getReferralsAtLevel([user.referralCode], 1);
        res.json(members);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.aggregate([
            { $match: { role: 'user', status: 'active' } },
            {
                $addFields: {
                    totalEarnings: { $add: [{ $ifNull: ["$referralIncome", 0] }, { $ifNull: ["$wallet.pending_referral", 0] }] }
                }
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 20 },
            { $project: { username: 1, referralCount: 1, referralIncome: "$totalEarnings" } }
        ]);
        res.json(topUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getReferralHistory = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const history = await Transaction.find({ userId: userId, type: 'referral_commission' }).sort({ createdAt: -1 }).limit(100).lean();
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
"""

with open(file_path, 'w') as f:
    f.write(content)
print("Successfully restored ReferralController.js with full functionality.")
