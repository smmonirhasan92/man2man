const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function fixIncome() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        console.log("Forcing Income Correction for test55 to $0.09...");

        const res = await User.updateOne(
            { username: 'test55' },
            {
                $set: {
                    "wallet.income": 0.09
                }
            }
        );

        console.log("Update Result:", res);

        const user = await User.findOne({ username: 'test55' });
        console.log("VERIFY -> New Income Balance:", user.wallet.income);
        console.log("VERIFY -> Main Balance:", user.wallet.main);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fixIncome();
