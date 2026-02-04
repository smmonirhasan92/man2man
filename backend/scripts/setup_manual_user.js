const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("Connected to DB");

        const CryptoService = require('../modules/security/CryptoService');
        const username = 'test-usa';
        const password = 'password';
        const phone = '01999999999';

        // Hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const phoneHash = CryptoService.hash(phone);
        // Encryption removed (Plain Text Requirement)

        // CLEAN START
        await User.deleteOne({ username: username });

        const update = {
            fullName: 'Manual Test User',
            username: username,
            primary_phone: phone,
            phoneHash: phoneHash,
            synthetic_phone: '+1 (555) 019-9999', // Manual US Identity
            password: hashedPassword,
            role: 'user',
            country: 'US', // Matches 'test-usa' intent

            // [REFACTOR] Flat Wallet
            main_balance: 50000,
            game_balance: 1000,
            income_balance: 0,
            purchase_balance: 0,

            status: 'active'
        };

        const user = await User.findOneAndUpdate({ username: username }, update, { upsert: true, new: true });
        console.log(`✅ User Ready: ${user.username} (Pass: ${password})`);
        console.log(`   Wallet: Main=${user.main_balance}, Game=${user.game_balance}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
