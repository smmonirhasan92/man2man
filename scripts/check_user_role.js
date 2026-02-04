const mongoose = require('mongoose');
const User = require('../backend/modules/user/UserModel');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkAndPromote() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected to DB');

        const phone = '01700000000';
        const user = await User.findOne({ primary_phone: phone });

        if (!user) {
            console.log('User NOT found for phone:', phone);
            process.exit(1);
        }

        console.log(`Current Role: ${user.role}`);
        console.log(`Current ID: ${user._id}`);
        console.log(`Current RefCode: ${user.referralCode}`);

        if (user.role !== 'super_admin') {
            console.log('Promoting to super_admin...');
            user.role = 'super_admin';
            try {
                await user.save();
                console.log('Successfully saved user as super_admin');
            } catch (saveError) {
                console.error('Error saving user:', saveError.message);
                // Try direct update if save fails due to validations (hacky)
                await User.updateOne({ _id: user._id }, { $set: { role: 'super_admin' } });
                console.log('Forced update via updateOne');
            }
        } else {
            console.log('User is already super_admin');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAndPromote();
