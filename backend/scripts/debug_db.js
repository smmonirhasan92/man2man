const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../modules/user/UserModel');

async function run() {
    console.log("URI:", process.env.MONGODB_URI);
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("✅ Connected to Mongo");

        const count = await User.countDocuments({});
        console.log("User Count:", count);

        const users = await User.find({}, 'phone fullName _id');
        console.log("All Users:", JSON.stringify(users, null, 2));

        const user = await User.findOne({ primary_phone: '01912345678' });
        console.log("Found User:", user ? user._id : 'NULL');
        if (user) console.log("User Plans:", (await require('../modules/plan/UserPlanModel').find({ userId: user._id })).length);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
