const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://monirhasan:monirhasan@cluster0.n1p6n.mongodb.net/usa-afiliate?retryWrites=true&w=majority&appName=Cluster0');

    // Check Tasks
    const mongooseDb = mongoose.connection.db;
    const taskCol = mongooseDb.collection('taskads');
    const allTasks = await taskCol.find({}).toArray();
    console.log("=== TASKS ===");
    console.log(`Found ${allTasks.length} total tasks.`);

    let serverCount = {};
    allTasks.forEach(t => {
        serverCount[t.server_id] = (serverCount[t.server_id] || 0) + 1;
    });
    console.log("Tasks arranged by server:", serverCount);

    // Check Plans
    const planCol = mongooseDb.collection('plans');
    const allPlans = await planCol.find({}).toArray();
    console.log("\n=== PLANS ===");
    allPlans.forEach(p => {
        console.log(`Plan: ${p.plan_name} | server_id: ${p.server_id} | price: $${p.price_usd}`);
    });

    process.exit(0);
}
check();
