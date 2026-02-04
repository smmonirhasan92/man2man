const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const NotificationService = require('../notification/NotificationService');
const { runTransaction } = require('../common/TransactionHelper');

class LeaderboardService {

    /**
     * Get Global Leaderboard based on Weighted Score.
     * Score = (ReferralCount * 0.6) + (TotalEarnings * 0.4)
     * Returns Top 10.
     */
    static async getGlobalLeaderboard() {
        // Aggregate to calculate score and sort
        const leaderboard = await User.aggregate([
            { $match: { status: 'active', referralCount: { $gt: 0 } } },
            {
                $addFields: {
                    // Normalizing: Assume 1 Ref = 1 Point, 100 BDT = 1 Point approx? 
                    // Let's stick to raw formula requested: (ReferralCount * 0.6) + (TotalEarnings * 0.4)
                    // Note: referralIncome is in BDT. 
                    score: {
                        $add: [
                            { $multiply: ['$referralCount', 0.6] },
                            { $multiply: ['$referralIncome', 0.4] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 10 },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    photoUrl: 1,
                    referralCount: 1,
                    referralIncome: 1,
                    country: 1,
                    badges: 1,
                    score: 1
                }
            }
        ]);

        return leaderboard;
    }

    /**
     * Process Weekly Royal Dividend (Sunday Midnight).
     * Pays Top 3 Users.
     */
    static async processRoyalDividend() {
        console.log('[RoyalDividend] Starting Weekly Payout...');

        const payoutLogic = async (session) => {
            // Get Top 3
            const topUsers = await LeaderboardService.getGlobalLeaderboard(); // Reuse aggregation
            // Note: getGlobalLeaderboard doesn't use session, but read is fine.

            if (topUsers.length === 0) return { success: false, message: 'No users found' };

            const prizes = [500, 300, 100]; // 1st, 2nd, 3rd
            const winners = topUsers.slice(0, 3);

            for (let i = 0; i < winners.length; i++) {
                const winner = winners[i];
                const prize = prizes[i];

                if (!prize) continue;

                // Credit Wallet
                await User.findByIdAndUpdate(winner._id, {
                    $inc: { 'wallet.main': prize }
                }).session(session);

                // Log Transaction
                await Transaction.create([{
                    userId: winner._id,
                    type: 'bonus',
                    amount: prize,
                    status: 'completed',
                    description: `Royal Dividend - Rank #${i + 1}`,
                    metadata: { rank: i + 1, week: new Date().toISOString() }
                }], { session });

                // Notification
                NotificationService.send(winner._id, `👑 Royal Dividend! You received ৳${prize} for Rank #${i + 1}!`, 'success');
            }

            // Global Notification (Simulated broadcast)
            // NotificationService.broadcast(`👑 Royal Dividend Paid to Top 3 Empire Builders!`);

            return { success: true, winners: winners.length };
        };

        try {
            const result = await runTransaction(payoutLogic);
            console.log('[RoyalDividend] Payout Complete:', result);
            return result;
        } catch (e) {
            console.error('[RoyalDividend] Failed:', e);
            return { success: false, error: e.message };
        }
    }
}

module.exports = LeaderboardService;
