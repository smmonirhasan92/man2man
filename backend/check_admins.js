require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function checkAndRestore() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'name phone role status');
        console.log("=== ALL REMAINING USERS ===\n", JSON.stringify(users, null, 2));

        // If only the unknown super admin is there, we can forcibly change its password to admin123 and phone to something known.
        // Or if the original user's phone is known, we can fetch it, even if deleted? No, if it was deleted, it's gone.
        // Let's print out what we find.
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAndRestore();
