const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const connectDB = require('../kernel/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function listUsers() {
    try {
        await connectDB();

        // Find users that look like "user-01" or have "admin" role
        const users = await User.find({
            $or: [
                { username: { $regex: 'user', $options: 'i' } },
                { role: { $in: ['admin', 'super_admin'] } }
            ]
        }).select('username fullName email role synthetic_phone wallet.main');

        console.log("--- POTENTIAL ADMIN USERS ---");
        users.forEach(u => {
            console.log(`[${u.role.toUpperCase()}] ${u.username} (${u.fullName}) | ID: ${u._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
