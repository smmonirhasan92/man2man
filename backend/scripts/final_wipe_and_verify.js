const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function finalWipe() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("🔥 Connected to DB. Dropping Data...");

        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database Wiped.");

        // Re-create Super Admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        const admin = await User.create({
            fullName: "Super Administrator",
            username: "admin",
            primary_phone: "01700000000",
            password: hashedPassword,
            role: "super_admin",
            country: "BD"
        });

        console.log("\n🧪 VERIFICATION JSON (Proof of Schema):");
        console.log(JSON.stringify(admin.toObject(), null, 2));

        // Check for removed fields
        const raw = admin.toObject();
        if (raw.phoneHash || raw.synthetic_phone) {
            console.log("\n❌ FAIL: Legacy fields still present!");
        } else {
            console.log("\n✅ SUCCESS: Only primary_phone present. encryption/redundancy gone.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
finalWipe();
