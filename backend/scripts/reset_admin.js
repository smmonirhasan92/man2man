const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

async function resetAdmin() {
    try {
        console.log('CONNECTING TO DB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const phone = '01700000000'; // Default Admin Phone
        const password = '123';

        console.log(`Resetting password for ${phone}...`);

        let user = await User.findOne({ phone });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (!user) {
            console.log('User not found. Creating new ADMIN...');
            user = await User.create({
                username: 'admin',
                phone: phone,
                email: 'admin@man2man.com',
                password: hashedPassword,
                role: 'admin',
                fullName: 'System Admin',
                country: 'BD'
            });
        } else {
            console.log('User found. Updating password...');
            user.password = hashedPassword;
            await user.save();
        }

        console.log('✅ PASSWORD RESET SUCCESS!');
        console.log(`User: ${phone}`);
        console.log(`Pass: ${password}`);

        process.exit(0);
    } catch (e) {
        console.error('❌ RESET FAILED:', e);
        process.exit(1);
    }
}

resetAdmin();
