const mongoose = require('mongoose');
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TASKS = [
    { title: "NVIDIA AI Processing", url: "https://nvidia.com", reward: 0.85 },
    { title: "Tesla Neural Net Training", url: "https://tesla.com/ai", reward: 0.90 },
    { title: "Google DeepMind Data Entry", url: "https://deepmind.google", reward: 0.75 },
    { title: "OpenAI Model Feedback", url: "https://openai.com", reward: 0.80 },
    { title: "Amazon AWS Lambda check", url: "https://aws.amazon.com", reward: 0.65 },
    { title: "Microsoft Azure Node Sync", url: "https://azure.microsoft.com", reward: 0.70 },
    { title: "SpaceX Starlink Telemetry", url: "https://spacex.com", reward: 0.95 },
    { title: "Apple iCloud Security Audt", url: "https://apple.com", reward: 0.82 },
    { title: "Meta VR Texture Mapping", url: "https://meta.com", reward: 0.78 },
    { title: "Netflix Content Delivery", url: "https://netflix.com", reward: 0.60 },
    { title: "Adobe Cloud Rendering", url: "https://adobe.com", reward: 0.68 },
    { title: "Intel Chip Verification", url: "https://intel.com", reward: 0.72 },
    { title: "AMD Driver Stress Test", url: "https://amd.com", reward: 0.74 },
    { title: "Salesforce CRM Data Sync", url: "https://salesforce.com", reward: 0.66 },
    { title: "Oracle Database Sharding", url: "https://oracle.com", reward: 0.69 },
    { title: "IBM Quantum Computing Sim", url: "https://ibm.com", reward: 0.99 },
    { title: "Cisco Network Packet Tracing", url: "https://cisco.com", reward: 0.62 },
    { title: "HP Enterprise Cloud Log", url: "https://hpe.com", reward: 0.64 },
    { title: "Dell Server Diagnostics", url: "https://dell.com", reward: 0.61 },
    { title: "Uber Eats Route Optimization", url: "https://uber.com", reward: 0.58 }
];

const seedTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Get Valid Plans
        const plans = await Plan.find({ type: 'server' });
        const planIds = plans.map(p => p._id);

        if (planIds.length === 0) {
            console.log("No plans found. Cannot link tasks.");
            return;
        }

        console.log("Clearing old tasks...");
        await TaskAd.deleteMany({});

        console.log("Seeding 20 High-End Tasks...");
        const tasksToInsert = TASKS.map(t => ({
            title: t.title,
            url: t.url,
            duration: 15,
            priority: 10,
            type: 'ad_view',
            reward_amount: t.reward,
            valid_plans: planIds, // Link to all plans
            is_active: true
        }));

        await TaskAd.insertMany(tasksToInsert);
        console.log("✅ 20 Tasks Seeded Successfully.");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

seedTasks();
