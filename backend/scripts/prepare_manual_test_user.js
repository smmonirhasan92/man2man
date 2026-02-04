const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function setup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        await User.deleteMany({ primary_phone: '01711111111' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const user = await User.create({
            fullName: 'Test User',
            username: 'tester01',
            primary_phone: '01711111111',
            password: hashedPassword,
            role: 'user',
            main_balance: 10000,
            game_balance: 0,
            income_balance: 0,
            purchase_balance: 0,
            referralCode: 'TEST01',
            country: 'Bangladesh',
            referralSecurity: { currentId: 'TEST01', expiresAt: new Date(Date.now() + 86400000), history: [] },
            taskData: { accountTier: 'Starter' },
            status: 'active'
        });

        console.log("USER CREATED: 01711111111 / 123456");
    } catch (e) { console.error("ERROR:", JSON.stringify(e, null, 2)); }
    finally { mongoose.disconnect(); }
}
setup();
