const mongoose = require('mongoose');

// Connect to testing database directly for diagnosis
require('./backend/kernel/database')().then(async () => {
    try {
        const UserPlan = require('./backend/modules/plan/UserPlanModel');
        const Plan = require('./backend/modules/admin/PlanModel');
        const TaskAd = require('./backend/modules/task/TaskAdModel');
        const User = require('./backend/modules/user/UserModel');

        // Let's find a user who has an active plan
        const activePlan = await UserPlan.findOne({ status: 'active' }).populate('userId');

        if (!activePlan) {
            console.log("No active plans found.");
            process.exit(0);
        }

        console.log(`User ID: ${activePlan.userId._id}`);
        console.log(`Plan ID: ${activePlan.planId}`);
        console.log(`USA Key: ${activePlan.syntheticPhone}`);

        const planDetails = await Plan.findById(activePlan.planId);
        console.log(`Plan Server ID: ${planDetails.server_id}`);

        const tasksForServer = await TaskAd.find({ server_id: planDetails.server_id });
        console.log(`Tasks for ${planDetails.server_id}: ${tasksForServer.length}`);

        if (tasksForServer.length > 0) {
            console.log("First task summary:");
            console.log(tasksForServer[0]);
        }

    } catch (e) {
        console.error("Diagnosis error:", e);
    } finally {
        mongoose.connection.close();
    }
});
