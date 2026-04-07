const mongoose = require('mongoose');
const P2PAudit = require('../modules/gamification/P2PAuditModel');
require('dotenv').config({ path: '../.env' }); // or whichever env connects to the correct DB

async function runAudit() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log("Connected to DB, fetching last 10 P2P batches...");

        const batches = await P2PAudit.find().sort({ createdAt: -1 }).limit(10);
        
        console.log("\n--- LAST 10 P2P BATCHES ---");
        batches.forEach(b => {
             console.log(`\nBatch ID: ${b._id}`);
             console.log(`Time: ${b.createdAt}`);
             console.log(`GameType: ${b.gameType}`);
             console.log(`Players in Batch: ${b.players.length}`);
             console.log(`Financials: TotalBetIn=${b.financials.totalBetIn.toFixed(2)}, RedisContribution(75%)=${b.financials.redisPotContribution.toFixed(2)}, TotalPayoutOut=${b.financials.totalPayoutOut.toFixed(2)}`);
             console.log(`Redis Pot State: Before=${b.redisPotState.before.toFixed(2)} | After=${b.redisPotState.after.toFixed(2)}`);
             b.players.forEach((p, idx) => {
                 console.log(`  Player ${idx+1}: Bet=${p.betAmount.toFixed(2)} -> Win=${p.winAmount.toFixed(2)} | Profit=${p.netProfit.toFixed(2)}`);
             });
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runAudit();
