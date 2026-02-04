const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../modules/user/UserModel'); // Using New Schema
const Transaction = require('../modules/wallet/TransactionModel');
const Task = require('../modules/task/TaskAdModel'); // Or similar if exists
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function nuclearReset() {
    try {
        console.log("☢️ STARTING NUCLEAR RESET...");
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("✅ Connected to DB");

        // 1. WIPE DATA
        console.log("🗑️ Wiping Data...");
        await User.deleteMany({});
        await Transaction.deleteMany({});
        // await Task.deleteMany({}); // Optional: Keep tasks for now or wipe if requested. "tasks and transaction history" requested.
        try { await mongoose.connection.collection('tasks').deleteMany({}); } catch (e) { } // Generic wipe
        try { await mongoose.connection.collection('admins').deleteMany({}); } catch (e) { } // If exists
        console.log("✅ Data Wiped.");

        // 2. CREATE SUPER ADMIN
        const phone = '01700000000';
        const password = '123456';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crypto Service for consistent Hash (if used by login index)
        const CryptoService = require('../modules/security/CryptoService');
        const phoneHash = CryptoService.hash(phone);

        const admin = await User.create({
            fullName: 'Super Admin',
            username: 'admin01',
            primary_phone: phone, // NEW SCHEMA KEY
            phoneHash: phoneHash,
            synthetic_phone: '+1 (000) 000-0000', // Admin Default
            password: hashedPassword,
            role: 'super_admin',
            country: 'BD',

            // Flat Wallet
            main_balance: 1000000,
            game_balance: 1000000,
            income_balance: 0,

            status: 'active'
        });

        console.log("\n👑 SUPER ADMIN CREATED:");
        console.log({
            id: admin._id,
            phone: admin.primary_phone,
            role: admin.role,
            balance: admin.main_balance
        });

    } catch (e) {
        console.error("❌ Reset Failed:", e);
    } finally {
        await mongoose.disconnect();
    }
}

nuclearReset();
