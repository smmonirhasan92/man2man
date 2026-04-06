const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// [FIX] Force Localhost for Windows execution
const mongoUri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1').replace('host.docker.internal', '127.0.0.1');
process.env.REDIS_URL = (process.env.REDIS_URL || 'redis://127.0.0.1:6379').replace('host.docker.internal', '127.0.0.1');

const UniversalMatchMaker = require('./modules/gamification/UniversalMatchMaker');
const RedisService = require('./services/RedisService');
const GameVault = require('./modules/gamification/GameVaultModel');
const P2PAudit = require('./modules/gamification/P2PAuditModel');

async function runAuditSimulation() {
    try {
        console.log("--- 🕵️ P2P MATHEMATICAL AUDIT START (100 BETS) ---");

        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB Connected.");

        // --- 1. RESET BASELINE ---
        await P2PAudit.deleteMany({});
        await RedisService.client.set('livedata:game:match_pot', 500); // Start pot at 500 NXS
        await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
            $set: {
                'balances.adminIncome': 0,
                'balances.userInterest': 0,
                'balances.activePool': 500,
                'stats.totalBetsIn': 0,
                'stats.totalPayoutsOut': 0,
                'stats.totalGamesPlayed': 0
            }
        }, { upsert: true });

        const vaultBefore = await GameVault.getMasterVault();
        const redisBefore = parseFloat(await RedisService.get('livedata:game:match_pot')) || 0;

        console.log(`\n📊 BASELINE:`);
        console.log(`- Redis Pot: ${redisBefore} NXS`);
        console.log(`- Admin Income: ${vaultBefore.balances.adminIncome} NXS`);
        console.log(`- Interest Fund: ${vaultBefore.balances.userInterest} NXS`);
        console.log("----------------------------");

        // --- 2. EXECUTE 100 BETS ---
        const totalBets = 100;
        const betPromises = [];
        const dummyUserId = new mongoose.Types.ObjectId();

        console.log(`💥 Executing ${totalBets} simulated bets (Spin & Scratch)...`);

        for (let i = 0; i < totalBets; i++) {
            const isSpin = Math.random() > 0.5;
            const amount = isSpin ? (Math.random() > 0.7 ? 12 : 4) : (Math.random() > 0.7 ? 25 : 5);
            const gameType = isSpin ? 'spin' : 'scratch';
            betPromises.push(UniversalMatchMaker.processMatch(dummyUserId, amount, gameType, 0));
        }

        const results = await Promise.all(betPromises);
        console.log(`✅ ${results.length} bets processed successfully.`);

        // --- 3. HARVEST RESULTS ---
        const vaultAfter = await GameVault.getMasterVault();
        const redisAfter = parseFloat(await RedisService.get('livedata:game:match_pot')) || 0;
        const totalWagered = vaultAfter.stats.totalBetsIn;
        const totalPayout = vaultAfter.stats.totalPayoutsOut;
        
        const adminDelta = vaultAfter.balances.adminIncome - vaultBefore.balances.adminIncome;
        const interestDelta = vaultAfter.balances.userInterest - vaultBefore.balances.userInterest;
        const combinedGrossProfit = adminDelta + interestDelta;
        const rulePercentage = (combinedGrossProfit / totalWagered) * 100;

        console.log(`\n📊 FINAL AUDIT REPORT:`);
        console.log(`- Total Wagered In: ${totalWagered.toFixed(2)} NXS`);
        console.log(`- Total Payout Out: ${totalPayout.toFixed(2)} NXS`);
        console.log(`- Win/Loss Ratio (RTP): ${((totalPayout / totalWagered) * 100).toFixed(2)}%`);
        console.log(`----------------------------`);
        console.log(`💰 GROSS PROFIT BREAKDOWN:`);
        console.log(`- Admin Fee (10%): ${adminDelta.toFixed(2)} NXS`);
        console.log(`- Interest Fund (15%): ${interestDelta.toFixed(2)} NXS`);
        console.log(`- TOTAL GROSS PROFIT (25%): ${combinedGrossProfit.toFixed(2)} NXS`);
        console.log(`----------------------------`);
        console.log(`🔍 RULE VALIDATION:`);
        console.log(`- (Admin + Interest) / Total Bet = ${rulePercentage.toFixed(2)}%`);
        
        const isValid = Math.abs(rulePercentage - 25) < 0.01;
        console.log(isValid ? "✅ MATHEMATICAL AUDIT PASSED: 25% Rule adhered to strictly." : "❌ AUDIT FAILED: Math discrepancy detected.");

        // --- 4. SHOW AUDIT SAMPLE ---
        const lastAudit = await P2PAudit.findOne().sort({ createdAt: -1 }).lean();
        console.log("\n--- 📝 P2P AUDIT LEDGER SAMPLE ---");
        console.log(JSON.stringify(lastAudit, null, 2));

        process.exit(isValid ? 0 : 1);
    } catch (err) {
        console.error("Simulation Fatal Error:", err);
        process.exit(1);
    }
}

runAuditSimulation();
