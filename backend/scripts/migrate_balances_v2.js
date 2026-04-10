const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/man2man";

async function migrateBalances() {
    try {
        console.log("🚀 Starting Currency Normalization Balance Migration (Factor x 2)...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const users = await User.find({});
        console.log(`Found ${users.length} users to adjust.`);

        let updatedCount = 0;

        for (const user of users) {
             const oldMain = user.wallet.main || 0;
             const oldIncome = user.wallet.income || 0;

             if (oldMain === 0 && oldIncome === 0) continue;

             // Factor x 2 calculation
             const newMain = oldMain * 2;
             const newIncome = oldIncome * 2;

             // Update Wallet
             await User.updateOne(
                 { _id: user._id },
                 { 
                     $set: { 
                         'wallet.main': newMain,
                         'wallet.income': newIncome 
                     }
                 }
             );

             // Log Transaction for Audit
             await Transaction.create({
                 userId: user._id,
                 type: 'adjustment',
                 amount: newMain - oldMain, // The delta added
                 status: 'completed',
                 description: `Currency Normalization (1 NXS = 1 Cent Upgrade). Multiplied by 2.`,
                 metadata: { oldMain, newMain, oldIncome, newIncome }
             });

             updatedCount++;
             console.log(`[PASS] User: ${user.username.padEnd(15)} | Main: ${oldMain} -> ${newMain} | Income: ${oldIncome} -> ${newIncome}`);
        }

        console.log(`\n✅ Migration Complete! Updated ${updatedCount} active wallets.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Migration Failed:", err);
        process.exit(1);
    }
}

migrateBalances();
