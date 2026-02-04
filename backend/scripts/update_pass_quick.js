const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function updatePass() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ primary_phone: '01711111111' });
        if (user) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('123456', salt);
            await user.save();
            console.log("Password updated to 123456");
        } else {
            console.log("User not found to update");
        }
    } catch (e) { console.error(e); }
    finally { mongoose.disconnect(); }
}
updatePass();
