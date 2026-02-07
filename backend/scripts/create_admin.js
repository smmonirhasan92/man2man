const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');

// Config
const MONGO_URI = 'mongodb+srv://smmonirhasan92_db_user:xe83pvLwW1iLAhic@cluster0.ttzbkr2.mongodb.net/universal_game_core_v1';
const ADMIN_PHONE = '01700000000';
const ADMIN_PASS = '123456';

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        let admin = await User.findOne({ primary_phone: ADMIN_PHONE });

        if (admin) {
            console.log('Admin already exists. Updating role/password...');
            admin.role = 'super_admin';
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(ADMIN_PASS, salt);
            admin.wallet.main = 100000; // Give some funds for testing
            await admin.save();
            console.log('Admin Updated!');
        } else {
            console.log('Creating new Admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(ADMIN_PASS, salt);

            await User.create({
                fullName: 'Super Admin',
                username: 'superadmin',
                primary_phone: ADMIN_PHONE,
                country: 'BD',
                password: hashedPassword,
                role: 'super_admin',
                wallet: { main: 100000, game: 0, income: 0, purchase: 0 }
            });
            console.log('Admin Created!');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin();
