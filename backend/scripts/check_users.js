const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../modules/user/UserModel');

async function checkUsers() {
    console.log("🔍 CHECKING USERS...");
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({});
        console.log(`   Found ${users.length} users.`);
        if (users.length > 0) {
            console.log("   First 3 Users:");
            users.slice(0, 3).forEach(u => console.log(`   - Phone: ${u.phone}, Role: ${u.role}, ID: ${u._id}`));
        } else {
            console.log("   ❌ NO USERS FOUND.");
        }

        // Check specifically for the one the user is trying
        const specific = await User.findOne({ primary_phone: '01700000000' });
        if (specific) {
            console.log("   ✅ User 01700000000 EXISTS.");
        } else {
            console.log("   ❌ User 01700000000 DOES NOT EXIST.");
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
}

checkUsers();
