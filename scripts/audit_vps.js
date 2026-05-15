const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        const targetId = new mongoose.Types.ObjectId('69c4ad8513abadc84ae254d5');

        console.log("=== STARTING BALANCE CORRECTION ===");

        // 1. Get User
        const user = await db.collection('users').findOne({ _id: targetId });
        if (!user) throw new Error("User not found");

        console.log(`Current Balance: ${user.wallet.main}`);
        console.log(`Current Turnover: ${user.turnover?.required}`);

        // The exact erroneous bonus amount added
        const ERROR_BONUS = 1712345678;

        // 2. Correct Wallet
        const newMain = user.wallet.main - ERROR_BONUS;
        const newTurnoverRequired = (user.turnover?.required || 0) - ERROR_BONUS;

        console.log(`New Balance will be: ${newMain}`);
        console.log(`New Turnover will be: ${newTurnoverRequired}`);

        // Update User
        await db.collection('users').updateOne(
            { _id: targetId },
            { 
                $set: { 
                    'wallet.main': newMain,
                    'turnover.required': newTurnoverRequired > 0 ? newTurnoverRequired : 1200
                } 
            }
        );

        // 3. Fix the original transaction to remove the absurd bonusAmount
        await db.collection('transactions').updateOne(
            { _id: new mongoose.Types.ObjectId('69fd6917ff2aed470deef92b') },
            { $set: { bonusAmount: 0 } }
        );

        // 4. Create an admin_adjustment log for the fix so there is a trail
        await db.collection('transactions').insertOne({
            userId: targetId,
            type: 'admin_adjustment',
            amount: -ERROR_BONUS,
            currency: 'NXS',
            status: 'completed',
            source: 'system',
            description: 'System Correction: Removed 1.7B Typo Bonus from Deposit',
            createdAt: new Date(),
            updatedAt: new Date(),
            balanceAfter: newMain
        });

        console.log("=== CORRECTION APPLIED SUCCESSFULLY ===");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
