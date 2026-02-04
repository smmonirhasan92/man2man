require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const TaskAd = require('../modules/task/TaskAdModel');

const updateServer01 = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Updating SERVER_01 Tasks...`);

        // Update all tasks bound to SERVER_01
        const res = await TaskAd.updateMany(
            { server_id: 'SERVER_01' },
            { $set: { reward_amount: 0.0152 } }
        );

        console.log(`✅ Updated ${res.modifiedCount} tasks for SERVER_01 to $0.0152.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateServer01();
