const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');
require('dotenv').config({ path: './backend/.env' });

async function audit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        const user = await User.findOne({ username: 'test55' });
        if (!user) return console.log("User not found");

        console.log(`Auditing User: ${user.username} (${user._id})`);

        // Fetch all income-related transactions
        // Income Sources: task_reward, referral_commission
        // Income Debits: wallet_transfer (where description says 'Income to Main' or metadata currency is USD/Income)

        const txns = await Transaction.find({ userId: user._id }).sort({ createdAt: 1 });

        let calculatedIncome = 0;
        let calculatedMain = 0;
        let log = [];

        for (const t of txns) {
            // INCOME LOGIC
            if (t.type === 'task_reward' || t.type === 'referral_commission') {
                calculatedIncome += t.amount;
                log.push(`[+Income] ${t.amount} (${t.type}) -> ${calculatedIncome}`);
            }
            else if (t.type === 'wallet_transfer') {
                // If amount is negative and it's from income
                if (t.amount < 0 && (t.description.includes('Income') || t.metadata?.currency === 'USD')) {
                    calculatedIncome += t.amount; // amount is negative
                    log.push(`[-Income] ${t.amount} (Transfer) -> ${calculatedIncome}`);
                }
                // If amount is positive and it's to main (Net Credit)
                else if (t.amount > 0 && (t.description.includes('Main') || t.metadata?.currency === 'BDT')) {
                    calculatedMain += t.amount;
                    log.push(`[+Main] ${t.amount} (Transfer Credit) -> ${calculatedMain}`);
                }
                // Determine if it was legacy swap?
                else {
                    // Assuming generic transfer affects Main unless specified?
                    // Let's check current 'wallet.main' legacy logic.
                    // Usually deposits add to Main.
                }
            }
            else if (t.type === 'deposit' || t.type === 'add_money' || t.type === 'game_win') {
                calculatedMain += t.amount;
            }
            else if (t.type === 'withdraw' || t.type === 'game_loss' || t.type === 'game_bet' || t.type === 'plan_purchase') {
                calculatedMain += t.amount; // usually negative
            }
        }

        console.log("\n--- AUDIT RESULT ---");
        console.log("Calculated Income:", calculatedIncome.toFixed(4));
        console.log("Current DB Income:", user.wallet.income);

        console.log("Calculated Main  :", calculatedMain.toFixed(4));
        console.log("Current DB Main  :", user.wallet.main);

        // AUTO FIX INCOME if deviation > 0.01
        if (Math.abs(calculatedIncome - user.wallet.income) > 0.01) {
            console.log(`\nMISMATCH DETECTED! Fixing Income to ${calculatedIncome.toFixed(2)}...`);
            await User.updateOne(
                { _id: user._id },
                { $set: { "wallet.income": calculatedIncome } }
            );
            console.log("Users wallet.income updated.");
        } else {
            console.log("\nIncome Balance Verified Correct.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

audit();
