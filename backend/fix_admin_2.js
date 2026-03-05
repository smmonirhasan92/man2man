require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash('admin123', salt);

        // Use updateOne to bypass mongoose validation in case the document is missing a required field
        const res = await User.updateOne(
            { role: 'super_admin' },
            { $set: { password: newPassword, phone: '01712345678' } }
        );

        console.log("SUCCESS! Admin updated. matched:", res.matchedCount, "modified:", res.modifiedCount);
        console.log("Login with Phone: 01712345678 and Password: admin123");

        process.exit(0);
    } catch (e) {
        console.error("ERROR", e);
        process.exit(1);
    }
}
fixAdmin();
