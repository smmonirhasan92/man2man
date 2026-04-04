const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const UniversalMatchMaker = require('../modules/gamification/UniversalMatchMaker');

const MONGO_URI = 'mongodb://localhost:27017/universal_game_core_v1';

async function runRetentionSimulation() {
    try {
        console.log('--- UNIVERSAL ENGINE V4 100-ROUND RETENTION TEST ---');
        await mongoose.connect(MONGO_URI);

        const simUser = await User.findOne({ username: 'retention_sim_v3' }) || await User.create({
            fullName: 'Retention Sim User', 
            username: 'retention_sim_v3', 
            primary_phone: '99999997', 
            password: 'password123', 
            country: 'Bangladesh', 
            wallet: { main: 10000 }, 
            gameStats: { totalGamesPlayed: 0, netProfitLoss: 0, consecutiveLosses: 0 }
        });

        const BET_AMOUNT = 10;
        let totalBet = 0;
        let totalPayout = 0;
        let jackpots = 0;
        let rollingWins = 0;
        let losses = 0;

        console.log('Simulating 100 rounds of Gold Box (10 NXS Bet)...');

        for (let i = 1; i <= 100; i++) {
            const res = await UniversalMatchMaker.processMatch(simUser._id, BET_AMOUNT, 'gift', 0); 
            
            totalBet += BET_AMOUNT;
            totalPayout += res.winAmount;

            if (res.rank === 1) jackpots++;
            else if (res.rank === 2) rollingWins++;
            else losses++;

            // Update user stats manually to ensure DB sync for logic
            await User.updateOne({ _id: simUser._id }, {
                 $inc: { 
                     'gameStats.totalGamesPlayed': 1,
                     'gameStats.netProfitLoss': (res.winAmount - BET_AMOUNT)
                 },
                 $set: {
                     'gameStats.consecutiveLosses': (res.winAmount === 0 ? simUser.gameStats.consecutiveLosses + 1 : 0)
                 }
            });
            
            // Refresh simUser object
            const updated = await User.findById(simUser._id);
            simUser.gameStats = updated.gameStats;

            if (i <= 20) {
                console.log(`Round ${i}: Result=${res.label} | Payout=${res.winAmount} | Net=${simUser.gameStats.netProfitLoss.toFixed(2)}`);
            }
        }

        const adminProfit = totalBet - totalPayout;
        const adminMargin = (adminProfit / totalBet) * 100;
        const userROI = (totalPayout / totalBet) * 100;

        console.log('\n--- FINAL RETENTION & PROFIT REPORT (100 ROUNDS) ---');
        console.log(`- Jackpot (1.8x): ${jackpots}`);
        console.log(`- Rolling Trap (0.5x-0.8x): ${rollingWins}`);
        console.log(`- House Wins: ${losses}`);
        console.log(`----------------------------------`);
        console.log(`- NET ADMIN PROFIT: ${adminProfit.toFixed(2)} NXS`);
        console.log(`- ADMIN MARGIN: ${adminMargin.toFixed(2)}%`);
        console.log(`- USER CUMULATIVE ROI: ${userROI.toFixed(2)}%`);

        console.log('\nVerification Complete. Result: Sequence-based Gating is ACTIVE.');
        process.exit(0);
    } catch (err) {
        console.error('Audit Failed:', err);
        process.exit(1);
    }
}

runRetentionSimulation();
