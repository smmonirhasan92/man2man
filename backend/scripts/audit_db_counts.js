require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const UserPlan = require('../modules/plan/UserPlanModel');

const countDocs = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB: ${uri}`);
        console.log("Audit Counts:");

        const uCount = await User.countDocuments();
        const pCount = await UserPlan.countDocuments();
        const activePCount = await UserPlan.countDocuments({ status: 'active' });

        console.log(`Total Users: ${uCount}`);
        console.log(`Total Plans: ${pCount}`);
        console.log(`Active Plans: ${activePCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

countDocs();
