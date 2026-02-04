const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');

const ensureSuperAdmin = async () => {
    try {
        await connectDB();

        // 1. Create Super Admin
        const superPhone = '01700000000';
        const superExists = await User.findOne({ primary_phone: superPhone });

        if (!superExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin', salt); // Default Password

            await User.create({
                fullName: 'Super Admin',
                username: 'superadmin',
                phone: superPhone,
                email: 'super@admin.com',
                password: hashedPassword,
                role: 'super_admin',
                country: 'BD',
                wallet: { main: 1000000, income: 0, game: 0 }, // Startup Capital
                isDeviceWhitelisted: true, // MASTER KEY
                status: 'active'
            });
            console.log('✅ Super Admin Created (01700000000 / admin)');
        } else {
            // Force Role Update if exists (e.g. from partial wipe)
            superExists.role = 'super_admin';
            superExists.isDeviceWhitelisted = true;
            await superExists.save();
            console.log('✅ Super Admin Updated');
        }

        // 2. Create Demo User
        const userPhone = '01701010101';
        const userExists = await User.findOne({ primary_phone: userPhone });

        if (!userExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            await User.create({
                fullName: 'Demo User',
                username: 'demouser',
                phone: userPhone,
                password: hashedPassword,
                role: 'user',
                country: 'BD',
                wallet: { main: 500, income: 0, game: 0 },
                status: 'active'
            });
            console.log('✅ Demo User Created (01701010101 / 123456)');
        } else {
            console.log('ℹ️ Demo User Already Exists');
        }

        process.exit(0);

    } catch (err) {
        console.error('❌ Error Seeding Data:', err);
        process.exit(1);
    }
};

ensureSuperAdmin();
