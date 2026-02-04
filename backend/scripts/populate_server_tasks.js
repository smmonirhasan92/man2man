const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

const TARGET_SERVERS = [
    'SERVER_02', // Basic Node US2
    'SERVER_03', // Standard Node CA1
    'SERVER_04', // Enhanced Node CA2
    'SERVER_05', // Advanced Node UK1
    'SERVER_06', // Pro Node UK2
    'SERVER_07', // Elite Node IE1
    'SERVER_08', // Enterprise Node IE2
    'SERVER_09'  // Ultimate Cluster IE3
];

async function populateTasks() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Fetch Source Tasks (SERVER_01)
        const sourceTasks = await TaskAd.find({ server_id: 'SERVER_01' });
        console.log(`Found ${sourceTasks.length} source tasks from SERVER_01.`);

        if (sourceTasks.length === 0) {
            console.error("No source tasks found! Cannot clone.");
            process.exit(1);
        }

        let totalCreated = 0;

        // 2. Clone for each target server
        for (const serverId of TARGET_SERVERS) {
            console.log(`Processing ${serverId}...`);

            // Force Insert
            // const existingCount = await TaskAd.countDocuments({ server_id: serverId });
            // if (existingCount > 0) {
            //    console.log(` - Skipping ${serverId} (Already has ${existingCount} tasks)`);
            //    continue;
            // }

            const newTasks = sourceTasks.map(task => {
                const newTask = task.toObject();
                delete newTask._id; // New ID
                delete newTask.__v;
                newTask.server_id = serverId; // New Server ID
                newTask.is_active = true;
                return newTask;
            });

            await TaskAd.insertMany(newTasks);
            console.log(` - Inserted ${newTasks.length} tasks for ${serverId}`);
            totalCreated += newTasks.length;
        }

        console.log(`Population Complete. Total Created: ${totalCreated}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

populateTasks();
