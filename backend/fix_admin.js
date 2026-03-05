require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ role: 'super_admin' });

        if (admin) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash('admin123', salt);
            await admin.save();
            console.log("SUCCESS! Admin password reset to: admin123");
            console.log(`Phone to login: ${admin.phone}`);
            console.log(`Name: ${admin.name}`);
        } else {
            console.log("NO SUPER ADMIN FOUND!");
        }
        process.exit(0);
    } catch (e) {
        console.error("ERROR", e);
        process.exit(1);
    }
}
fixAdmin();
