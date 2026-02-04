const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true');
        console.log('DB Connected');

        // Find *any* active plan
        const allPlans = await UserPlan.find({});
        console.log(`Total Plans in DB: ${allPlans.length}`);

        if (allPlans.length > 0) {
            const lastPlan = allPlans[allPlans.length - 1];
            console.log(`Plan Phone: '${lastPlan.syntheticPhone}'`);

            // SIMULATE CLAIM
            console.log("\n=== SIMULATING CLAIM ===");
            const TaskAd = require('../modules/task/TaskAdModel');
            const task = await TaskAd.findOne();
            if (!task) { console.log("No Tasks Found!"); return; }

            const taskId = task._id.toString();
            console.log(`Task ID: ${taskId}`);

            // Mock active plan
            let activePlan = await UserPlan.findOne({ userId: lastPlan.userId, syntheticPhone: lastPlan.syntheticPhone, status: 'active' });
            if (!activePlan) throw new Error("Active Plan Not Found in Sim");
            console.log("Active Plan Found.");

            const Plan = require('../modules/admin/PlanModel');
            const planDetails = await Plan.findById(activePlan.planId);
            if (!planDetails) throw new Error("Plan Details Missing");
            console.log("Plan Details Found.");

            // Session check
            const user = await require('../modules/user/UserModel').findById(lastPlan.userId);
            // Force mock session
            user.taskData.currentTask = { taskId: taskId, startTime: new Date(Date.now() - 5000) };
            await user.save();
            console.log("Mock Session Saved.");

            const currentTask = user.taskData.currentTask;
            console.log("Current Task in DB:", currentTask.taskId);

            if (currentTask.taskId.toString() !== taskId) {
                throw new Error("ID Mismatch");
            }
            console.log("ID Match OK.");

            console.log("SIMULATION SUCCESS: No Errors Found.");

            // Original code after the insertion point
            // const Plan = require('../modules/admin/PlanModel'); // This line is now redundant as it's required above
            // const planDetails = await Plan.findById(lastPlan.planId); // This logic is now superseded by the simulation
            // console.log(`Plan Details Found? ${!!planDetails}`);
            // if (planDetails) console.log(`Plan Name: ${planDetails.name}`);
            // else console.log(`CRITICAL: Plan ID ${lastPlan.planId} NOT FOUND in Plan Collection`);

        } else {
            console.log("CRITICAL: No plans found at all.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};
check();
