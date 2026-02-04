const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");
        const user = await User.findOne({ username: 'test55' });
        if (user) {
            console.log("User Found:", user._id);
            console.log("Wallet:", user.wallet);
        } else {
            console.log("User 'test55' NOT FOUND");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
check();
