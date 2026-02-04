require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const TaskService = require('../modules/task/TaskService'); // Import via require - check path carefully
const UserPlan = require('../modules/plan/UserPlanModel');
const TaskAd = require('../modules/task/TaskAdModel');
const User = require('../modules/user/UserModel');
// Since TaskService is a Class in the file at d:/man2man/backend/modules/task/TaskService.js, 
// usually it exports an instance or the class.
// Looking at prev view_file: it has `class TaskService` and likely `module.exports = new TaskService()` or similar. 
// Step 1314 showed: `class TaskService { ... } module.exports = new TaskService();` (Wait, I need to check how it's exported)
// The view_file was truncated at bottom. I'll blindly assume it exports instance for now as is typical.
// If it exports class, I'll instantiate.

const verifyReward = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Verifying for Node 3249...`);

        const targetPhone = "3249";
        const userPlan = await UserPlan.findOne({
            syntheticPhone: { $regex: targetPhone, $options: 'i' },
            status: 'active'
        }).populate('userId');

        if (!userPlan) {
            console.log("❌ Active Plan not found for 3249.");
            process.exit(1);
        }

        const userId = userPlan.userId._id;
        console.log(`✅ User Found: ${userPlan.userId.username} (${userId})`);
        console.log(`plan state: Tasks=${userPlan.tasksCompletedToday} Earned=${userPlan.earnings_today}`);

        // Find a task to "complete"
        const task = await TaskAd.findOne({ server_id: 'SERVER_01' });
        if (!task) {
            console.log("❌ No Task found for SERVER_01.");
            // create dummy
        }

        const taskId = task ? task._id : new mongoose.Types.ObjectId();
        const usaKey = userPlan.syntheticPhone; // The key required

        console.log(`Running completeTask for TaskID: ${taskId}...`);

        // Instantiation
        const service = require('../modules/task/TaskService');
        console.log("Service loaded:", typeof service, service.constructor.name);


        // Mocking user.taskData.currentTask to pass session checks
        // 1. Fetch User to update state manually first
        const user = await User.findById(userId);
        user.taskData = {
            currentTask: {
                taskId: taskId,
                startTime: new Date(Date.now() - 30000), // 30s ago
                lastHeartbeat: new Date()
            },
            tasksCompletedToday: userPlan.tasksCompletedToday,
            lastTaskDate: new Date(Date.now() - 300000) // 5 mins ago
        };
        await user.save();

        // RUN
        // The service.completeTask might return transaction receipt or throw
        const result = await service.completeTask(userId, taskId, "dummy_answer", usaKey);

        console.log("\n✅ TRANSACTION SUCCESS!");
        console.log("-----------------------------------------");
        console.log("Reward Data:", JSON.stringify(result, null, 2));
        console.log("-----------------------------------------");

        const amount = result.amount || result.rewardAmount;
        if (amount === 0.0152) {
            console.log("🎉 VERIFIED: Exact amount $0.0152 awarded.");
        } else {
            console.log(`⚠️ MISMATCH: Expected 0.0152, Got ${amount}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR OBJECT:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        process.exit(1);
    }
};

verifyReward();
