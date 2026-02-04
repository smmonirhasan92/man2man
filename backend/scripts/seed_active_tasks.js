const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

const ADS = [
    { title: "Watch: Premium Tech Review", reward: 12, time: 10, type: "video" },
    { title: "Visit: Official Sponsor", reward: 8, time: 5, type: "ad_view" }, // was link
    { title: "Like: Community Update", reward: 5, time: 3, type: "social" },
    { title: "Review: Quick Feedback", reward: 15, time: 20, type: "review" }, // was survey
    { title: "Social: Partner App", reward: 25, time: 30, type: "social" } // was install
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to Mongo.");

        // 1. Get All Plans
        const plans = await Plan.find({});
        if (plans.length === 0) {
            console.error("No plans found! Cannot link tasks.");
            return;
        }
        const planIds = plans.map(p => p._id);
        console.log(`Found ${plans.length} Plans. Linking tasks to all.`);

        // 2. Clear Existing Tasks
        await TaskAd.deleteMany({});
        console.log("Cleared existing tasks.");

        // 3. Generate 30 Tasks
        const tasks = [];
        for (let i = 0; i < 30; i++) {
            const template = ADS[i % ADS.length];
            tasks.push({
                title: `${template.title} #${i + 1}`,
                // description: "Complete this simple task...", // Not in schema? Remove to be safe or check schema lines 40+
                // Schema view was truncated, but description is common. If strict, omit.
                // Added url which is required
                url: "https://google.com",
                reward_amount: template.reward,
                duration: template.time,
                type: template.type,
                valid_plans: planIds, // Link to ALL plans
                is_active: true,
                priority: 100 - i
            });
        }

        await TaskAd.insertMany(tasks);
        console.log(`Successfully inserted ${tasks.length} Active Tasks.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
