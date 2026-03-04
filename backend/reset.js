require('dotenv').config();
const mongoose = require('mongoose');

// Models to clean
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');
const TransactionLedger = require('./modules/wallet/TransactionLedgerModel');
const P2PTrade = require('./modules/p2p/P2PTradeModel');
const LotteryReceipt = require('./modules/game/LotteryReceiptModel');

async function runReset() {
    console.log("🚀 Starting Production Database Reset...");

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Custom DB Connected.");

        // 1. Delete all users EXCEPT super_admin
        const userDeleteRes = await User.deleteMany({ role: { $ne: 'super_admin' } });
        console.log(`💥 Deleted ${userDeleteRes.deletedCount} Users (kept super_admin).`);

        // 2. Wipe ALL Transactions
        const txDeleteRes = await Transaction.deleteMany({});
        console.log(`💥 Deleted ${txDeleteRes.deletedCount} UI Transactions.`);

        // 3. Wipe ALL Ledger Entries
        const ledgerDeleteRes = await TransactionLedger.deleteMany({});
        console.log(`💥 Deleted ${ledgerDeleteRes.deletedCount} Ledger Entries.`);

        // 4. Wipe ALL P2P Trades
        const p2pDeleteRes = await P2PTrade.deleteMany({});
        console.log(`💥 Deleted ${p2pDeleteRes.deletedCount} P2P Trades.`);

        // 5. Wipe ALL Lottery Receipts (Tickets)
        const receiptDeleteRes = await LotteryReceipt.deleteMany({});
        console.log(`💥 Deleted ${receiptDeleteRes.deletedCount} Lottery Receipts.`);

        // 6. Reset Super Admin's wallet to 0 and clear referral history if needed
        const superAdmin = await User.findOne({ role: 'super_admin' });
        if (superAdmin) {
            superAdmin.wallet = {
                main: 0,
                purchase: 0,
                game: 0,
                commission: 0,
                escrow_locked: 0,
                turnoverRequired: 0,
                turnoverCurrent: 0,
                deposit: 0,
                income: 0
            };
            superAdmin.network = {
                totalReferrals: 0,
                activeReferrals: 0,
                totalTeamDeposit: 0
            };
            await superAdmin.save();
            console.log("✅ Super Admin wallet reset to 0.");
        } else {
            console.log("⚠️ Super Admin not found!");
        }

        console.log("🎉 PRODUCTION RESET COMPLETE! It is safe to launch.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Reset Failed:", err);
        process.exit(1);
    }
}

runReset();
