require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function createFreshAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Delete any existing broken super admins to avoid conflicts
        await User.deleteMany({ role: 'super_admin' });

        // Create a perfect, fully-formed super admin from scratch
        const newAdmin = new User({
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
            }
        });

        await newAdmin.save();

        console.log("=========================================");
        console.log("SUCCESS! FRESH ADMIN ACCOUNT CREATED.");
        console.log("LOGIN DETAILS:");
        console.log(`Phone: ${newAdmin.phone}`);
        console.log("Password: admin123");
        console.log("=========================================");

        process.exit(0);
    } catch (e) {
        console.error("ERROR CREATING ADMIN", e);
        process.exit(1);
    }
}
createFreshAdmin();
