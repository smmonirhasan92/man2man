const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function clean() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await User.deleteMany({ primary_phone: '01711111111' });
        console.log("CLEANED");
    } catch (e) { console.error(e); }
    finally { mongoose.disconnect(); }
}
clean();
