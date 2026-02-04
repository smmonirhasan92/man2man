const mongoose = require('mongoose');
const dotenv = require('dotenv');
const JackpotService = require('../modules/bonus/JackpotService');
const User = require('../modules/user/UserModel');
const BonusVault = require('../modules/bonus/BonusVaultModel');
const TransactionHelper = require('../modules/common/TransactionHelper');

dotenv.config();

const runTest = async () => {
    try {
        console.log("🔥 STARTING JACKPOT TEST...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        // 1. Ensure Vault has money
        let vault = await BonusVault.findOne();
        if (!vault) {
            vault = await BonusVault.create({ balance: 50000, totalIn: 50000, totalOut: 0 });
        }
        if (vault.balance < 5000) {
            vault.balance += 5000;
            await vault.save();
        }
        console.log(`Vault Balance: ${vault.balance}`);

        // 2. Play some games to qualify users
        // ... Assuming manual play or previous test script populated GameLogs

        // 3. Trigger Draw
        console.log("\n--- TRIGGERING HOURLY DRAW ---");
        try {
            const result = await JackpotService.drawHourlyJackpot();
            if (result) {
                console.log("✅ Draw Success:", result);
            } else {
                console.log("⚠️ Draw Triggered but no winner (or empty vault)");
            }
        } catch (e) {
            console.error("Draw Failed:", e.message);
        }

        console.log("\n✅ Test Complete.");
        process.exit(0);

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
        process.exit(1);
    }
};

runTest();
