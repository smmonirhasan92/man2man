const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifyAdmin() {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        const phone = '01700000000';
        const user = await User.findOne({ mobile: phone });

        if (user) {
            console.log("\n✅ ADMIN ACCOUNT FOUND");
            console.log("----------------------");
            console.log("Phone:   ", user.mobile);
            console.log("ID:      ", user._id);
            console.log("Role:    ", user.role || 'N/A'); // Check if role is admin
            console.log("IsActive:", user.isActive);
            console.log("----------------------\n");
        } else {
            console.log("\n❌ ADMIN ACCOUNT NOT FOUND for:", phone);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAdmin();
