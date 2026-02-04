const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("Connected to DB");

        const phone = '01711111111';
        const password = 'password';

        // Hash
        const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const update = {
            fullName: 'Test Admin',
            username: 'admin_test',
            phone: phone,
            phoneHash: phoneHash,
            password: hashedPassword,
            role: 'admin',
            country: 'US',
            wallet: { main: 10000, income: 0, game: 10000 }
        };

        const user = await User.findOneAndUpdate({ phone: phone }, update, { upsert: true, new: true });
        console.log("✅ Admin User Created/Updated:", user.primary_phone, user._id);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
