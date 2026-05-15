const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1')
    .then(async () => {
        console.log('DB Connected.');
        const ActualTransaction = require('./modules/wallet/TransactionModel.js');

        const badTx = await ActualTransaction.findOne({ description: /System Correction: Removed 1.7B Typo Bonus from Deposit/i });
        if (badTx) {
            console.log('Found bad transaction:', badTx);
            badTx.amount = 0; // Nullify amount to fix the Admin Loan UI bug
            await badTx.save();
            console.log('Fixed bad transaction amount to 0.');
        } else {
            console.log('Bad transaction not found.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
