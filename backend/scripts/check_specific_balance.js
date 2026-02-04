const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkBalance = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ primary_phone: '01701010101' });
        if (!user) {
            console.log('User 01701010101 not found');
        } else {
            console.log('User Found:', user.fullName);
            console.log('Main Balance:', user.main_balance);
            console.log('Game Balance:', user.game_balance);
        }
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

checkBalance();
