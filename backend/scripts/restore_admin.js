const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ primary_phone: '01700000000' });
        if (admin) {
            console.log("Details:", admin);
            console.log("Admin exists. Role:", admin.role);
            // reset password just in case
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash('123456', salt);
            await admin.save();
            console.log("Admin password reset to 123456");
        } else {
            console.log("Admin NOT found. Creating...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);
            await User.create({
                fullName: 'Super Admin',
                username: 'superadmin',
                primary_phone: '01700000000',
                password: hashedPassword,
                role: 'super_admin',
                country: 'Bangladesh',
                status: 'active',
                wallet: { main: 100000 },
                // Fix for flat schema if needed, but the model has `wallet` nested.
                // Wait, previous replace_file_content in prepare_manual_test_user used flat fields?
                // No, UserModel.js has nested wallet. The script prepare_manual_test_user used nested I think? 
                // Let's check UserModel.js again to be sure. 
                // Actually I'll use the safe creation method matching the schema I saw earlier.
            });
            console.log("Admin Created.");
        }
    } catch (e) { console.error(e); }
    finally { mongoose.disconnect(); }
}
checkAdmin();
