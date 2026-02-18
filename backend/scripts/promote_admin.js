const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const connectDB = require('../kernel/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function promoteAdmin() {
    try {
        await connectDB();

        // Search by ID suffix - The screenshot showed ...86E57AD9
        // Fetch recent 100 users
        const users = await User.find({}).sort({ createdAt: -1 }).limit(100).select('username fullName email role');

        console.log("--- SEARCHING 100 RECENT USERS FOR *57AD9 ---");
        const match = users.find(u => u._id.toString().toUpperCase().endsWith('57AD9'));

        if (match) {
            console.log(`✅ MATCH FOUND!`);
            console.log(`   User: ${match.username} (${match.fullName})`);
            console.log(`   ID: ${match._id}`);
            console.log(`   Role: ${match.role}`);

            if (match.role !== 'super_admin' && match.role !== 'admin') {
                match.role = 'super_admin';
                await match.save();
                console.log(`✨ Promoted to super_admin`);
            } else {
                console.log(`ℹ️ Already has admin privileges.`);
            }
        } else {
            console.log("❌ No user found ending in 57AD9 in recent 100 users.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

promoteAdmin();
