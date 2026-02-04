
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const CryptoService = require('../modules/security/CryptoService');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TARGET_PHONE = '01701010101';
const NEW_PASSWORD = '123456';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log('Connected to DB');

        // 1. Calculate Expected Hash with CURRENT Config
        const infoHash = CryptoService.hash(TARGET_PHONE);
        console.log(`Target Phone: ${TARGET_PHONE}`);
        console.log(`Generated Hash (Current Env): ${infoHash}`);

        // 2. Find User (Try by Hash first, then by matching all users if needed - though checking specific phone is hard if encrypted)
        // Since we suspect Hash mismatch, looking up by 'phoneHash' might fail.
        // But we can't search by 'phone' because it's encrypted.
        // However, we can try to find by 'username' or just list users and decrypt phones to find the match?
        // Or just blindly update *if* the hash matches.

        // Strategy: Find by Hash. If found, simple update.
        // If NOT found, it means the Hash CHANGED (Env var issue).
        // Then we must find the user by iterating (slow but safe for script) or creating a new one.

        let user = await User.findOne({ phoneHash: infoHash });

        if (!user) {
            console.log('User not found by CURRENT hash. Searching all users to find by Decrypted Phone...');
            const allUsers = await User.find({});
            for (const u of allUsers) {
                const decrypted = CryptoService.decrypt(u.phone);
                if (decrypted === TARGET_PHONE) {
                    user = u;
                    console.log(`Found user ${u.username} by decrypting phone! Hash was mismatched.`);
                    break;
                }
            }
        }

        if (!user) {
            console.log('User DOES NOT EXIST. Creating new user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

            user = await User.create({
                fullName: 'Test User',
                username: 'testUser' + Math.floor(Math.random() * 1000),
                phone: CryptoService.encrypt(TARGET_PHONE),
                phoneHash: infoHash,
                password: hashedPassword,
                country: 'BD',
                wallet: { main: 1000, game: 0, income: 0, purchase: 0 },
                taskData: { accountTier: 'Starter' }
            });
            console.log('User Created!');
        } else {
            // Update User
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

            user.password = hashedPassword;
            user.primary_phoneHash = infoHash; // Fix hash if it was mismatched
            user.primary_phone = CryptoService.encrypt(TARGET_PHONE); // re-encrypt to be safe

            // Fix Wallet (Force Balance for testing)
            user.main_balance = 1000;

            await user.save();
            console.log(`User ${user.username} Updated! Password set to: ${NEW_PASSWORD}`);
        }

        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        mongoose.disconnect();
    }
};

run();
