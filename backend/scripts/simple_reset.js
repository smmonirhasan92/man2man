const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Simple wait
const wait = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const phone = '01700000000';
        const rawPass = '123';

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(rawPass, salt);

        const update = {
            password: hash,
            username: 'admin',
            role: 'admin',
            fullName: 'Admin User'
        };

        const user = await User.findOneAndUpdate({ phone }, update, { upsert: true, new: true });
        console.log('User Updated:', user.primary_phone, user.password.substring(0, 10) + '...');
        console.log('DONE');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
