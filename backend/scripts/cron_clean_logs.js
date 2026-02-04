
const mongoose = require('mongoose');
const GameLog = require('../modules/game/GameLogModel');
const Transaction = require('../modules/wallet/TransactionModel');

// DB Connection (Stand-alone script)
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man';

async function cleanLogs() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB for Cleaning...");

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Clean Game Logs
        const resGame = await GameLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
        console.log(`[CLEANUP] Deleted ${resGame.deletedCount} old Game Logs.`);

        // 2. Archive Transactions? (Optional, maybe just move to Archive collection)
        // For now, let's just keep Transactions as they are financial records. 
        // Only deleting GameLogs which can be huge.

        process.exit(0);

    } catch (err) {
        console.error("Cleanup Error:", err);
        process.exit(1);
    }
}

cleanLogs();
