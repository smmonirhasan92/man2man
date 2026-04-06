let UniversalMatchMaker;
let RedisService;
let GameVault;
let P2PAudit;

try {
    mongoose = require('mongoose');
    require('dotenv').config({ path: '.env.test' }); // Use local .env.test
    UniversalMatchMaker = require('./modules/gamification/UniversalMatchMaker');
    RedisService = require('./services/RedisService');
    GameVault = require('./modules/gamification/GameVaultModel');
    P2PAudit = require('./modules/gamification/P2PAuditModel');
} catch (e) {
    console.error("FATAL IMPORT ERROR:", e.message);
    process.exit(1);
}

async function runSimulation() {
    try {
        console.log("🚀 Starting P2P Stress Test Simulation (50 Bets)...");

        // 1. Connect MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man_local');
        console.log("✅ MongoDB Connected.");

        // 2. Connect Redis
        await RedisService.connect();
        
        // 3. Optional: Clear Audit & Pot to establish baseline
        await P2PAudit.deleteMany({});
        await RedisService.client.set('livedata:game:match_pot', 100); // Start pot at 100 NXS
        await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
            $set: {
                'balances.adminIncome': 0,
                'balances.userInterest': 50, // 50 NXS reserve
                'balances.activePool': 500  // Mongo Fallback Pool
            }
        }, { upsert: true });

        const vaultBefore = await GameVault.findOne({ vaultId: 'MASTER_VAULT' }).lean();
        const redisBefore = await RedisService.get('livedata:game:match_pot');

        console.log("\n--- 📊 BASELINE BEFORE SIMULATION ---");
        console.log("Redis P2P Pot:", redisBefore, "NXS");
        console.log("Mongo Admin Income:", vaultBefore.balances.adminIncome, "NXS");
        console.log("Mongo Interest Fund:", vaultBefore.balances.userInterest, "NXS");
        console.log("Mongo Active Pool Fallback:", vaultBefore.balances.activePool, "NXS");
        console.log("-------------------------------------\n");

        // 4. Generate 50 Bets Simulating High Concurrency
        // Mix of Spin (Bronze=4, Silver=8, Gold=12) and Scratch (Bronze=5, Silver=10, Gold=25)
        const bets = [];
        const dummyUserId = new mongoose.Types.ObjectId(); // Use a dummy ID for tests
        
        for (let i = 0; i < 50; i++) {
            const isSpin = Math.random() > 0.5;
            const amount = isSpin ? (Math.random() > 0.5 ? 4 : 12) : (Math.random() > 0.5 ? 5 : 25);
            const gameType = isSpin ? 'spin' : 'scratch';
            
            // Push to Promise array (simulating concurrent user clicks!)
            bets.push(UniversalMatchMaker.processMatch(dummyUserId, amount, gameType, 0));
        }

        console.log(`💥 Firing ${bets.length} concurrent requests into UniversalMatchMaker...`);
        const results = await Promise.all(bets);

        // 5. Audit Validation Post-Simulation
        const vaultAfter = await GameVault.findOne({ vaultId: 'MASTER_VAULT' }).lean();
        const redisAfter = await RedisService.get('livedata:game:match_pot');
        const audits = await P2PAudit.find().limit(50).lean();

        let totalBetsIn = 0;
        let totalWinsOut = 0;
        let totalAdminExpected = 0;
        let totalInterestExpected = 0;
        let totalRedisExpected = 0;

        results.forEach((r, idx) => {
            // Find corresponding bet amount from audits
            const auditRef = audits.find(a => a.players.some(p => p.winAmount === r.winAmount)); 
            // Better to sum directly from audits!
        });

        audits.forEach(a => {
            totalBetsIn += a.financials.totalBetIn;
            totalWinsOut += a.financials.totalPayoutOut;
            totalAdminExpected += a.financials.adminFeeDeducted;
            totalInterestExpected += a.financials.interestFundDeducted;
            totalRedisExpected += a.financials.redisPotContribution;
        });

        console.log("\n=== 🎯 SIMULATION RESULTS ===");
        console.log(`Total Bets Processed: ${bets.length}`);
        console.log(`Total Vault Wagered In: ${vaultAfter.stats.totalBetsIn - vaultBefore.stats.totalBetsIn} NXS (Expected: ${totalBetsIn.toFixed(2)})`);
        console.log(`Total Vault Winnings Out: ${vaultAfter.stats.totalPayoutsOut - vaultBefore.stats.totalPayoutsOut} NXS (Expected: ${totalWinsOut.toFixed(2)})`);

        console.log("\n=== 💰 TRIPLE-STREAM BREAKDOWN ===");
        console.log(`1. Admin Income [10%]: +${totalAdminExpected.toFixed(2)} NXS (Vault Delta: ${(vaultAfter.balances.adminIncome - vaultBefore.balances.adminIncome).toFixed(2)})`);
        console.log(`2. User Interest [15%]: +${totalInterestExpected.toFixed(2)} NXS (Vault Delta: ${(vaultAfter.balances.userInterest - vaultBefore.balances.userInterest).toFixed(2)})`);
        console.log(`3. Redis Pot Contributions [75%]: +${totalRedisExpected.toFixed(2)} NXS`);

        console.log("\n=== 🌊 REDIS POT SYNC VERIFICATION ===");
        console.log(`Initial Redis Pot: ${redisBefore} NXS`);
        console.log(`Final Redis Pot: ${redisAfter} NXS`);
        
        const predictedRedis = parseFloat(redisBefore) + totalRedisExpected - totalWinsOut;
        console.log(`Predicted Redis Pot (Baseline + Contributions - Total Wins): ${predictedRedis.toFixed(2)} NXS`);
        const bufferDeficit = (vaultBefore.balances.activePool - vaultAfter.balances.activePool) + (vaultBefore.balances.userInterest - vaultAfter.balances.userInterest + totalInterestExpected);
        
        console.log(`Mongo Pool Backup Usage (Tight Mode / High Win Deficit): ${bufferDeficit.toFixed(2)} NXS`);

        console.log("\n✅ P2P Logic verification completed!");
        process.exit(0);

    } catch (err) {
        console.error("Simulation Error:", err);
        process.exit(1);
    }
}

runSimulation();
