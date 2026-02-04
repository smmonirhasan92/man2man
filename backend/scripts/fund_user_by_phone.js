const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');

async function fundUser() {
    const phone = process.argv[2];
    const amount = parseFloat(process.argv[3]) || 500;

    if (!phone) {
        console.error("Usage: node fund_user_by_phone.js <phone> <amount>");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        const user = await User.findOne({ primary_phone: phone });

        if (!user) {
            console.error(`User not found: ${phone}`);
            process.exit(1);
        }

        user.wallet.main_balance = (user.wallet.main_balance || 0) + amount;
        await user.save();

        await Transaction.create({
            userId: user._id,
            type: 'add_money',
            amount: amount,
            status: 'completed',
            description: 'Manual Funding for Browser Test'
        });

        console.log(`SUCCESS: Funded ${phone} with ${amount}`);
        console.log(`NEW_BALANCE: ${user.wallet.main_balance}`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
fundUser();
