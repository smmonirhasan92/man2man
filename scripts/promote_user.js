const mongoose = require('mongoose');
const User = require('../backend/modules/user/UserModel');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function promote() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected to DB');

        const phone = '01700000000';
        const user = await User.findOne({ primary_phone: phone });

        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.role = 'super_admin';
        await user.save();

        console.log(`User ${phone} promoted to SUPER_ADMIN`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

promote();
