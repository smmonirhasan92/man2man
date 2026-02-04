const mongoose = require('mongoose');
const TransactionLedger = require('../modules/wallet/TransactionLedgerModel');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../kernel/database');

const run = async () => {
    await connectDB();
    console.log("DB Connected");

    const userId = new mongoose.Types.ObjectId(); // Dummy ID

    console.log("--- TEST 1: create([{ ... }]) (Array) ---");
    try {
        await TransactionLedger.create([{
            userId: userId,
            type: 'test_array',
            amount: 100,
            fee: 0,
            balanceBefore: 0,
            balanceAfter: 100,
            transactionId: `TEST_ARR_${Date.now()}`
        }]);
        console.log("TEST 1 PASSED");
    } catch (e) {
        console.error("TEST 1 FAILED:", e.message);
    }

    console.log("--- TEST 2: create({ ... }) (Object) ---");
    try {
        await TransactionLedger.create({
            userId: userId,
            type: 'test_obj',
            amount: 100,
            fee: 0,
            balanceBefore: 0,
            balanceAfter: 100,
            transactionId: `TEST_OBJ_${Date.now()}`
        });
        console.log("TEST 2 PASSED");
    } catch (e) {
        console.error("TEST 2 FAILED:", e.message);
    }

    process.exit(0);
};

run();
