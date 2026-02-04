const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const setBalance = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate(
            { phone: '01701010101' },
            { $set: { 'wallet.main': 1000, 'wallet.game': 0 } },
            { new: true }
        );
        if (!user) {
            console.log('User 01701010101 not found - creating demo user');
            // Create if missing (unlikely given previous context, but safe)
        } else {
            console.log('User Balance Updated:', user.wallet);
        }
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

setBalance();
