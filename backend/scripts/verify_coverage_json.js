const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
const OUTPUT_FILE = path.join(__dirname, '../../logs/task_coverage.json');

async function checkCoverage() {
    try {
        await mongoose.connect(MONGO_URI);

        const counts = await TaskAd.aggregate([
            { $group: { _id: "$server_id", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const sample = await TaskAd.findOne({ server_id: 'SERVER_02' }).select('title server_id is_active reward_amount');

        const result = {
            counts,
            sample_server_02: sample
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
        console.log(`Coverage written to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCoverage();
