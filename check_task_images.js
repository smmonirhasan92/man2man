const mongoose = require('mongoose');

require('./backend/kernel/database')().then(async () => {
    try {
        const TaskAd = require('./backend/modules/task/TaskAdModel');
        const tasks = await TaskAd.find().limit(10);
        console.log("Tasks found:", tasks.length);

        tasks.forEach(t => {
            console.log(`ID: ${t._id} | Title: ${t.title}`);
            console.log(`  -> imageUrl: ${t.imageUrl}`);
            console.log(`  -> image_url: ${t.image_url}`);
        });

    } catch (e) {
        console.error("Diagnosis error:", e);
    } finally {
        mongoose.connection.close();
    }
});
