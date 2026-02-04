const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            directConnection: true
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkTasks = async () => {
    await connectDB();
    const TaskAd = require('./modules/task/TaskAdModel');

    // 1. Count Total Tasks
    const total = await TaskAd.countDocuments();
    console.log(`Total TaskAds: ${total}`);

    // 2. List first 5 tasks
    if (total > 0) {
        const tasks = await TaskAd.find().limit(5);
        console.log('Sample Tasks:', JSON.stringify(tasks, null, 2));
    }

    process.exit();
};

checkTasks();
