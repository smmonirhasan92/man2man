const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function checkCoverage() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const counts = await TaskAd.aggregate([
            { $group: { _id: "$server_id", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        console.log("Task Coverage by Server ID:");
        counts.forEach(c => {
            console.log(` - ${c._id}: ${c.count} tasks`);
        });

        if (counts.length === 0) {
            console.log("No tasks found at all.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCoverage();
