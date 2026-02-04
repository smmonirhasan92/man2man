const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function fixUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const phone = '01755555555';
        let user = await User.findOne({ primary_phone: phone });

        if (!user) {
            console.log('User not found. Creating...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            user = new User({
                username: 'test55',
                primary_phone: phone,
                password: hashedPassword,
                email: 'test55@example.com',
                fullName: 'Test User 55',
                role: 'user',
                country: 'BD',
                wallet: {
                    main_balance: 0,
                    game: 0,
                    income: 0
                }
            });
        } else {
            console.log('User found. Updating password...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('123456', salt);
        }

        await user.save();
        console.log(`User ${phone} ready with password '123456'`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixUser();
