const mongoose = require('mongoose');

async function test() {
    await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
    const Transaction = require('./backend/modules/wallet/TransactionModel');
    const TransactionLedger = require('./backend/modules/wallet/TransactionLedgerModel');
    
    console.log("--- RECENT TRANSACTIONS ---");
    const txs = await Transaction.find({ source: 'game', description: /Luck Test/ }).sort({createdAt:-1}).limit(5);
    for (let tx of txs) {
        console.log(`[TX] ${tx.createdAt} | Type: ${tx.type} | Amount: ${tx.amount} | Desc: ${tx.description} | ID: ${tx.transactionId}`);
    }

    console.log("\n--- RECENT LEDGER ENTRIES ---");
    const ledgers = await TransactionLedger.find({ description: /Luck Test/ }).sort({createdAt:-1}).limit(6);
    for (let l of ledgers) {
        console.log(`[LEDGER] ${l.createdAt} | Type: ${l.type} | Amount: ${l.amount} | Before: ${l.balanceBefore} | After: ${l.balanceAfter} | ID: ${l.transactionId}`);
    }

    mongoose.disconnect();
}
test();
