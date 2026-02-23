const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function checkUserRole() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await User.find({
            $or: [
                { primary_phone: { $regex: '01712345678' } },
                { phone: { $regex: '01712345678' } },
                { phone: { $regex: '1712345678' } },
                { primary_phone: { $regex: '1712345678' } }
            ]
        }).select('primary_phone phone role status fullName username');

        console.log('\n--- LIVE DATABASE USER CHECK ---');
        console.log(`Found ${users.length} matching users`);
        users.forEach((u, i) => console.log(`[${i}]`, u));
        console.log('--------------------------------\n');

    } catch (err) {
        console.error("Error connecting to DB:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkUserRole();
