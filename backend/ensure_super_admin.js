const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./modules/user/UserModel');

async function ensureSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('✅ Connected to MongoDB');

        const phone = '01900000000';
        const password = '000000'; // Setting simple password as requested

        let admin = await User.findOne({ phone });

        if (admin) {
            console.log('🔄 Admin found. Updating credentials...');
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
            admin.role = 'super_admin';
            admin.isDeviceWhitelisted = true; // Ensure they can login from anywhere
            await admin.save();
            console.log('✅ Admin credentials updated to: 000000');
        } else {
            console.log('🆕 Creating new Super Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            admin = await User.create({
                fullName: 'Super Admin',
                username: 'admin_019',
                phone: phone,
                password: hashedPassword,
                role: 'super_admin',
                country: 'Bangladesh',
                wallet: { main: 1000000, income: 0, game: 0 },
                isDeviceWhitelisted: true,
                kycStatus: 'approved'
            });
            console.log('✅ Super Admin Created Successfully!');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

ensureSuperAdmin();
