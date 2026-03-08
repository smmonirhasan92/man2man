require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const TransactionLedger = require('./backend/modules/wallet/TransactionLedgerModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');

async function test() {
    console.log("Connecting database...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/man2man");
    console.log("DB connected.");

    try {
        const user = await User.findOne({ role: 'user' });
        if (!user) throw new Error("No user to test with");

        const amount = 50;
        const type = 'credit';
        const note = 'test';
        const adminId = user._id; // mocking an admin ID for the test

        const fixedAmount = parseFloat(parseFloat(amount).toFixed(4));
        const adjustment = type === 'debit' ? -fixedAmount : fixedAmount;
        if (!user.wallet) user.wallet = { main: 0, escrow_locked: 0, commission: 0 };
        const balBefore = user.wallet.main || 0;
        const balAfter = parseFloat((balBefore + adjustment).toFixed(4));

        user.wallet.main = balAfter;
        await user.save();

        console.log('User saved. DB User Wallet:', user.wallet);

        console.log('Creating Ledger...');
        await TransactionLedger.create({
            userId: user._id,
            type: 'admin_adjustment',
            amount: adjustment,
            fee: 0,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            description: note || 'Admin Balance Adjustment',
            transactionId: 'TEST_' + Date.now(),
            metadata: { adminId: adminId }
        });
        console.log('Ledger saved');

        console.log('Creating Transaction...');
        await Transaction.create({
            userId: user._id,
            type: 'admin_adjustment',
            amount: adjustment,
            status: 'completed',
            source: 'admin',
            description: note || 'Admin Credit',
            balanceAfter: balAfter
        });
        console.log('Transaction saved successfully.');

    } catch (e) {
        console.error('ERROR CAUGHT DURING TEST:', e.message);
    }
    process.exit(0);
}
test();
