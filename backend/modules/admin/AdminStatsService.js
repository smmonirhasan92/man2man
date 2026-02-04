const User = require('../../user/UserModel');
const Transaction = require('../../modules/wallet/TransactionModel');
const GameLog = require('../../modules/game/GameLogModel');

class AdminStatsService {

    /**
     * Get Real-time Dashboard Stats
     */
    static async getDashboardStats() {
        try {
            // 1. User Stats
            const totalUsers = await User.countDocuments();
            // In a real app with sockets, we'd count socket connections.
            // For now, we can approximate "Active" as users active in last 10 mins 
            // OR just return a placeholder if we don't have 'lastActive' field.
            // Let's assume we don't have 'lastActive' properly indexed yet, so we return 0 or implement later.
            const activeUsers = 0; // Placeholder until Socket/Activity tracking is better.

            // 2. Financial Liability (Sum of all User Wallets - System Debt)
            const walletStats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalMain: { $sum: "$wallet.main" },
                        totalGame: { $sum: "$wallet.game" },
                        totalIncome: { $sum: "$wallet.income" }
                    }
                }
            ]);

            const liability = walletStats[0] || { totalMain: 0, totalGame: 0, totalIncome: 0 };
            const totalLiability = liability.totalMain + liability.totalGame + liability.totalIncome;

            // 3. Today's Financials
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const todayTx = await Transaction.aggregate([
                { $match: { createdAt: { $gte: startOfDay }, status: 'completed' } },
                {
                    $group: {
                        _id: "$type",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Parse Today's Stats
            let todayDeposit = 0;
            let todayWithdraw = 0;
            todayTx.forEach(t => {
                if (t._id === 'add_money' || t._id === 'deposit') todayDeposit += t.total;
                if (t._id === 'withdraw' || t._id === 'withdraw_money') todayWithdraw += t.total;
            });

            // 4. Game Performance (Aviator)
            // Last 100 rounds Avg Multiplier
            const recentGames = await GameLog.find({ gameId: 'aviator' })
                .sort({ createdAt: -1 })
                .limit(50)
                .select('multiplier crashPoint');

            // Calculate pseudo-RTP based on recent crash points (Simple avg)
            let sumMult = 0;
            recentGames.forEach(g => sumMult += (g.crashPoint || 0));
            const avgMult = recentGames.length ? (sumMult / recentGames.length) : 0;

            return {
                users: {
                    total: totalUsers,
                    active: activeUsers // To be connected to Socket
                },
                financials: {
                    totalLiability: totalLiability.toFixed(2),
                    breakdown: liability,
                    todayDeposit: todayDeposit.toFixed(2),
                    todayWithdraw: todayWithdraw.toFixed(2)
                },
                game: {
                    aviatorAvgMult: avgMult.toFixed(2),
                    totalRounds: await GameLog.countDocuments({ gameId: 'aviator' })
                }
            };

        } catch (error) {
            console.error("AdminStats Error:", error);
            throw new Error("Failed to fetch stats");
        }
    }
}

module.exports = AdminStatsService;
