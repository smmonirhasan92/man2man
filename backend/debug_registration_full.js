const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
// const CryptoService = require('./modules/security/CryptoService'); // Mocking if needed
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/universal_game_core_v1";

async function debugRegistration() {
    try {
        console.log("1. Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        // Simulate Payload from Frontend
        const RND = Math.floor(Math.random() * 10000);
        const reqBody = {
            fullName: "Debug Registrant",
            primary_phone: `017${RND}55555`,
            country: "Bangladesh",
            password: "password123",
            referralCode: "" // Optional
        };
        console.log("2. Payload:", reqBody);

        // --- LOGIC FROM auth.controller.js (SIMULATED) ---

        // 1. Check Existing
        const rawPhone = reqBody.primary_phone.replace(/^\+88/, '');
        console.log(`   - Normalized Phone: ${rawPhone}`);

        const existingUser = await User.findOne({
            primary_phone: { $in: [rawPhone, `+88${rawPhone}`] }
        });

        if (existingUser) {
            console.error("❌ User already exists!");
            process.exit(0);
        }

        // 2. Generate Fields
        const username = reqBody.fullName.split(' ')[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000);
        // Mock Referral ID generation
        const myReferralCode = 'REF' + Math.floor(Math.random() * 1000000);

        console.log(`   - Generated Username: ${username}`);
        console.log(`   - Generated RefCode: ${myReferralCode}`);

        // 3. Create
        console.log("3. Attempting User.create()...");

        try {
            const newUser = await User.create({
                fullName: reqBody.fullName,
                username: username,
                primary_phone: reqBody.primary_phone,
                country: reqBody.country,
                password: "hashed_password_mock", // Skip bcrypt for speed in debug
                role: 'user',
                wallet: {
                    main: 0.00,
                    game: 0.00,
                    income: 0.00
                },
                referralCode: myReferralCode,
                // Missing other fields? Let's see if it fails.
            });
            console.log(`✅ Success! User ID: ${newUser._id}`);
            console.log("   - Wallet State:", newUser.wallet);

        } catch (createErr) {
            console.error("❌ User.create FAILED:");
            if (createErr.errors) {
                Object.keys(createErr.errors).forEach(key => {
                    console.error(`   👉 [${key}]: ${createErr.errors[key].message}`);
                });
            } else {
                console.error("   👉 Error:", createErr.message);
            }
        }

    } catch (err) {
        console.error("❌ Global Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

debugRegistration();
