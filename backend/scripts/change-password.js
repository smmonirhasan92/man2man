const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function changePassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database Connected.');

        // Get arguments from command line
        // Usage: node scripts/change-password.js <phone> <new_password>
        const args = process.argv.slice(2);
        const phone = args[0];
        const newPassword = args[1];

        if (!phone || !newPassword) {
            console.error('❌ Usage: node scripts/change-password.js <phone> <new_password>');
            return;
        }

        const user = await User.findOne({ phone });

        if (!user) {
            console.error(`❌ User not found with phone: ${phone}`);
            return;
        }

        console.log(`✅ Found User: ${user.name || user.username || user.fullName} (${user.role})`);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user
        user.password = hashedPassword;
        await user.save();

        console.log('---------------------------------------------------');
        console.log(`✅ Password Changed Successfully for ${phone}`);
        console.log(`🔐 New Password: ${newPassword}`);
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

changePassword();
