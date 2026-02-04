const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Robust Path Resolution using CWD
const TaskPath = path.join(process.cwd(), 'backend/modules/task/TaskAdModel');
console.log('Loading TaskAdModel from:', TaskPath);
const TaskAd = require(TaskPath);

dotenv.config({ path: path.join(process.cwd(), '.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected to DB');

        const count = await TaskAd.countDocuments();
        console.log(`Total Tasks in DB: ${count}`);

        if (count === 0) {
            console.log('Tasks are missing! Need to seed.');
        } else {
            const tasks = await TaskAd.find({}).limit(5);
            console.log('Sample Tasks:', JSON.stringify(tasks, null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
