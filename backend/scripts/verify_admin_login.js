const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("✅ DB Connected");

        const phone = '01711111111';
        const password = 'password';

        const user = await User.findOne({ phone });
        if (!user) {
            console.log("❌ Admin User NOT FOUND in DB!");
        } else {
            console.log(`✅ Admin Found: ${user.primary_phone}, Role: ${user.role}`);
            const isMatch = await bcrypt.compare(password, user.password);
            console.log(`🔑 Password Match: ${isMatch}`);

            if (!isMatch) {
                console.log("⚠️ Hash in DB:", user.password);
                const newHash = await bcrypt.hash(password, 10);
                console.log("ℹ️ Expected Hash (Sample):", newHash);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
checkAdmin();
