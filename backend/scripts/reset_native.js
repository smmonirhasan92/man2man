const mongoose = require('mongoose');
require('dotenv').config();

async function nativeReset() {
    console.log("☢️ STARTING NUCLEAR RESET (Native Driver Mode)");
    try {
        const uri = process.env.MONGODB_URI;
        const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
        console.log(`🔌 Connecting to: ${maskedUri}`);

        const conn = await mongoose.connect(uri);
        const db = conn.connection.db;

        // 1. Update Users Collection Directly
        const users = db.collection('users');
        const updateResult = await users.updateMany(
            {},
            {
                $set: {
                    "wallet.main": 0,
                    "wallet.game": 0,
                    "wallet.income": 0,
                    "wallet.purchase": 0
                }
            }
        );
        console.log(`✅ Reset Wallets: ${updateResult.modifiedCount} documents updated.`);

        // 2. Clear Transactions
        const transactions = db.collection('transactions');
        const deleteResult = await transactions.deleteMany({});
        console.log(`✅ Cleared Transactions: ${deleteResult.deletedCount} documents deleted.`);

        console.log("✅ NUCLEAR RESET COMPLETE.");
        process.exit(0);
    } catch (e) {
        console.error("❌ FATAL ERROR:", e);
        process.exit(1);
    }
}

nativeReset();
