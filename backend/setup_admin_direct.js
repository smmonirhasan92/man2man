const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables prioritizing .env.production
if (fs.existsSync('./.env.production')) {
    dotenv.config({ path: './.env.production' });
    console.log("Loaded .env.production");
} else {
    dotenv.config();
    console.log("Loaded default .env");
}

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
console.log(`Connecting to: ${MONGO_URI.split('@').pop()}`); // Log safe URI part

const userSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    primary_phone: String,
    username: String,
    password: String,
    role: String,
    status: String,
    wallet: Object
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
    await mongoose.connect(MONGO_URI);
    const phone = '01712345678';

    // Cleanup erroneous duplicates created by previous script version
    await User.deleteMany({ phone: phone, primary_phone: { $exists: false } });
    await User.deleteMany({ phone: phone, primary_phone: null });

    // Find ANY existing users with either the raw or prefixed phone
    let users = await User.find({
        primary_phone: { $in: [phone, `+88${phone}`] }
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('000000', salt);

    if (users && users.length > 0) {
        for (let user of users) {
            user.role = 'super_admin';
            user.password = hashedPassword;
            user.phone = user.phone || phone; // sync both fields safely
            await user.save();
            console.log("Updated existing user to super_admin:", user.primary_phone || user.phone);
        }
    } else {
        await User.create({
            fullName: 'Super Admin',
            phone: phone,
            primary_phone: phone,
            username: 'SuperAdmin1',
            password: hashedPassword,
            role: 'super_admin',
            wallet: { main: 0, escrow_locked: 0, commission: 0 },
            status: 'active'
        });
        console.log("Created new super_admin user:", phone);
    }
    await mongoose.disconnect();
}
run();
