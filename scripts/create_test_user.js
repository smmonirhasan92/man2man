const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        const testUser = {
            username: 'test_admin',
            email: 'test@usaaffiliatemarketing.com',
            password: hashedPassword,
            fullName: 'Test Admin User',
            role: 'admin',
            isEmailVerified: true,
            status: 'active',
            referralCode: 'TEST2026',
            wallet: {
                main: 1000,
                purchase: 500,
                income: 0
            }
        };

        await User.findOneAndUpdate(
            { username: 'test_admin' },
            testUser,
            { upsert: true, new: true }
        );

        console.log("SUCCESS: Test Admin User Created!");
        console.log("Username: test_admin");
        console.log("Password: Admin@123");
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createTestUser();
