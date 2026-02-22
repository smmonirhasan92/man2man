const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MONGO_URI = 'mongodb://127.0.0.1:27017/man2man';

const userSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
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
    let user = await User.findOne({ phone });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('000000', salt);

    if (user) {
        user.role = 'super_admin';
        user.password = hashedPassword;
        await user.save();
        console.log("Updated existing user to super_admin:", user.phone);
    } else {
        await User.create({
            fullName: 'Super Admin',
            phone: phone,
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
