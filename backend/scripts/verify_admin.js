const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function verify() {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        const phone = '01700000000';
        const user = await User.findOne({ primary_phone: phone });

        if (user) {
            console.log(`FOUND User: ${user.primary_phone} | ID: ${user._id} | Role: ${user.role}`);
            console.log(`Password Hash: ${user.password.substring(0, 10)}...`);
        } else {
            console.log(`USER NOT FOUND: ${phone}`);
            // Auto-fix
            console.log("Attempting to create...");
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            await User.create({
                fullName: 'Super Admin',
                username: 'superadmin',
                primary_phone: phone,
                password: hashedPassword,
                role: 'super_admin',
                country: 'Bangladesh',
                status: 'active',
                wallet: { main_balance: 100000, main: 100000 } // Cover both bases
            });
            console.log("CREATED Super Admin.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
verify();
