const mongoose = require('mongoose');
const User = require('../backend/modules/user/UserModel');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function forceAdmin() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected.');

        const phone = '01700000000';

        // Use updateOne to bypass schema validation hooks if any
        const res = await User.updateOne(
            { primary_phone: phone },
            { $set: { role: 'super_admin' } }
        );

        console.log('Update Result:', res);

        const user = await User.findOne({ primary_phone: phone }).lean();
        if (user) {
            console.log(`VERIFICATION: User ${user.primary_phone} is now ${user.role}`);
        } else {
            console.log('User not found!');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

forceAdmin();
