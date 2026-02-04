const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function resyncUsers() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Dropping 'users' collection...");
        try {
            await mongoose.connection.collection('users').drop();
            console.log("Dropped 'users'.");
        } catch (e) {
            if (e.code === 26) console.log("'users' collection not found, skipping drop.");
            else throw e;
        }

        console.log("Seeding Users...");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // 1. Super Admin
        await User.create({
            fullName: 'Super Admin',
            username: 'super_admin',
            phone: '01700000000',
            password: hashedPassword,
            role: 'super_admin',
            status: 'active',
            country: 'BD', // Added
            wallet: { main: 10000, game: 10000 },
            referralCode: 'ADMIN001'
        });
        console.log("✅ Created Super Admin: 01700000000 / 123456");

        // 2. Standard User
        await User.create({
            fullName: 'Test User',
            username: 'test_user',
            phone: '01701010101',
            password: hashedPassword,
            role: 'user',
            status: 'active',
            country: 'BD', // Added
            wallet: { main: 500, game: 500 },
            referralCode: 'USER001'
        });
        console.log("✅ Created Test User: 01701010101 / 123456");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

resyncUsers();
