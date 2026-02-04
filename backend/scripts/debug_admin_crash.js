const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const TransactionLedger = require('../modules/wallet/TransactionLedgerModel');
const Transaction = require('../modules/wallet/TransactionModel');

// Hardcode URI from .env
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';

const runDebug = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB.");

        // 1. Find a user
        const user = await User.findOne();
        if (!user) {
            console.log("No user found.");
            process.exit(1);
        }
        console.log(`Testing with user: ${user.username} (${user._id})`);

        const amount = 100;
        const balBefore = user.wallet.main || 0;
        const balAfter = balBefore + amount;

        // 2. Simulate User Save
        console.log("Saving User...");
        user.wallet.main = balAfter;
        await user.save();
        console.log("User Saved.");

        // 3. Simulate Ledger Create (Object Syntax - The Fix)
        console.log("Creating Ledger (Object Syntax)...");
        await TransactionLedger.create({
            userId: user._id,
            type: 'admin_adjustment',
            amount: amount,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            description: "Debug Script Object",
            transactionId: `DBG_${Date.now()}`
        });
        console.log("Ledger Created.");

        // 4. Simulate Transaction Create (Object Syntax)
        console.log("Creating Transaction (Object Syntax)...");
        await Transaction.create({
            userId: user._id,
            type: 'admin_adjustment',
            amount: amount,
            status: 'completed',
            balanceAfter: balAfter
        });
        console.log("Transaction Created.");

        // 5. Simulate Array Syntax (The Bug?)
        console.log("Creating Ledger (Array Syntax - Expected to fail?)...");
        await TransactionLedger.create([{
            userId: user._id,
            type: 'admin_adjustment',
            amount: amount,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            description: "Debug Script Array",
            transactionId: `DBG_ARR_${Date.now()}`
        }]);
        console.log("Ledger Array Created.");


    } catch (e) {
        console.error("CRASH CAUGHT:", e);
        console.error("Stack:", e.stack);
    } finally {
        await mongoose.disconnect();
    }
};

runDebug();
