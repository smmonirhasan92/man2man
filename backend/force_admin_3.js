require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function createFreshAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Delete any existing broken super admins
        await User.deleteMany({ role: 'super_admin' });

        // Some older mongoose setups have strict indexing or require `country_code` / `deviceId` etc.
        // We will do a direct MongoDB insert to bypass all Mongoose application-level schemas completely.
        const db = mongoose.connection.db;

        await db.collection('users').insertOne({
            name: 'Main Admin',
            phone: '01712345678',
            email: 'admin@man2man.com',
            password: hashedPassword,
            role: 'super_admin',
            status: 'active',
            wallet: {
                main: 0,
                purchase: 0,
                game: 0,
                commission: 0,
                escrow_locked: 0,
                turnoverRequired: 0,
                turnoverCurrent: 0,
                deposit: 0,
                income: 0
            },
            network: {
                totalReferrals: 0,
                activeReferrals: 0,
                totalTeamDeposit: 0
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        });

        console.log("=========================================");
        console.log("SUCCESS! ADMIN CREATED (BYPASS DB INSERT).");
        console.log("LOGIN DETAILS:");
        console.log("Phone: 01712345678");
        console.log("Password: admin123");
        console.log("=========================================");

        process.exit(0);
    } catch (e) {
        console.error("ERROR CREATING ADMIN", e);
        process.exit(1);
    }
}
createFreshAdmin();
