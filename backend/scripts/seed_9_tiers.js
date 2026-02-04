const mongoose = require('mongoose');
const path = require('path');
const Plan = require(path.join(__dirname, '../modules/admin/PlanModel'));
const TaskAd = require(path.join(__dirname, '../modules/task/TaskAdModel'));
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TIERS = [
    { price: 500, roi: 1.50, tasks: 15, name: "Starter Node US1" },
    { price: 1000, roi: 1.54, tasks: 14, name: "Basic Node US2" },
    { price: 2000, roi: 1.58, tasks: 13, name: "Standard Node CA1" },
    { price: 3000, roi: 1.61, tasks: 12, name: "Enhanced Node CA2" },
    { price: 4000, roi: 1.65, tasks: 11, name: "Pro Node IE1" },
    { price: 5000, roi: 1.69, tasks: 10, name: "Advanced Node IE2" },
    { price: 7000, roi: 1.72, tasks: 9, name: "Elite Node UK1" },
    { price: 8500, roi: 1.76, tasks: 8, name: "Enterprise Node UK2" },
    { price: 10000, roi: 1.80, tasks: 7, name: "Ultimate Node GLB" }
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Failed', err);
        process.exit(1);
    }
};

const seed = async () => {
    await connectDB();

    console.log("Clearing existing plans...");
    await Plan.deleteMany({});

    // Also clear TaskAds since we will regenerate appropriate ones later or generic ones
    // Actually, let's keep tasks generic but ensure logic uses Plan params.
    // For now, removing old plans is key.

    const createdPlans = []; // Store IDs for linking

    for (const tier of TIERS) {
        const totalReturn = tier.price * tier.roi;
        const dailyIncome = totalReturn / 32;
        const perTaskRate = dailyIncome / tier.tasks;

        const plan = new Plan({
            name: tier.name,
            price: tier.price,
            type: 'server', // All server type
            validity: 32,
            daily_limit: tier.tasks,
            task_reward: parseFloat(perTaskRate.toFixed(4)), // High precision for exact Calc
            // Visual / Meta fields
            description: `${tier.tasks} Tasks/Day • ${Math.round((tier.roi - 1) * 100)}% Profit`,
            min_withdraw: 100, // Standard
            features: [
                `Daily Income: ৳${dailyIncome.toFixed(2)}`,
                `Total Return: ৳${totalReturn.toFixed(0)}`,
                `Validity: 32 Days`,
                `Task Rate: ৳${perTaskRate.toFixed(2)}`
            ]
        });

        await plan.save();
        console.log(`Created: ${tier.name} | ৳${tier.price} | ${tier.tasks} Tasks @ ৳${perTaskRate.toFixed(2)} | ROI: ${(tier.roi * 100).toFixed(0)}%`);
        createdPlans.push(plan._id);
    }

    // --- SEED TASKS ---
    console.log("Seeding High-End Tasks...");
    await TaskAd.deleteMany({}); // Clear old tasks

    const TASK_TEMPLATES = [
        { title: "NVIDIA AI Processing", url: "https://nvidia.com/ai", reward_amount: 5.00 }, // Base generic
        { title: "Tesla Neural Net", url: "https://tesla.com/autopilot", reward_amount: 5.00 },
        { title: "SpaceX Telemetry", url: "https://spacex.com/starlink", reward_amount: 5.00 },
        { title: "Amazon AWS Compute", url: "https://aws.amazon.com", reward_amount: 5.00 },
        { title: "Google Cloud Vertex", url: "https://cloud.google.com", reward_amount: 5.00 },
        { title: "Microsoft Azure Quantum", url: "https://azure.microsoft.com", reward_amount: 5.00 },
        { title: "Meta Verse Rendering", url: "https://meta.com", reward_amount: 5.00 },
        { title: "Apple Silicon Calc", url: "https://apple.com", reward_amount: 5.00 },
        { title: "Netflix CDN Node", url: "https://netflix.com", reward_amount: 5.00 },
        { title: "Oracle Data Mining", url: "https://oracle.com", reward_amount: 5.00 },
        { title: "IBM Watson Health", url: "https://ibm.com/watson", reward_amount: 5.00 },
        { title: "Intel Foundry Logic", url: "https://intel.com", reward_amount: 5.00 },
        { title: "AMD Ryzen Thread", url: "https://amd.com", reward_amount: 5.00 },
        { title: "Adobe Creative Render", url: "https://adobe.com", reward_amount: 5.00 },
        { title: "Salesforce CRM Sync", url: "https://salesforce.com", reward_amount: 5.00 },
        { title: "Cisco Network Grid", url: "https://cisco.com", reward_amount: 5.00 },
        { title: "Qualcomm Snapdragon", url: "https://qualcomm.com", reward_amount: 5.00 },
        { title: "Uber Logistics Map", url: "https://uber.com", reward_amount: 5.00 },
        { title: "Spotify Audio Encode", url: "https://spotify.com", reward_amount: 5.00 },
        { title: "Airbnb Host Verify", url: "https://airbnb.com", reward_amount: 5.00 }
    ];

    for (const tmpl of TASK_TEMPLATES) {
        await TaskAd.create({
            title: tmpl.title,
            description: "High Performance Computing Task",
            url: tmpl.url,
            reward_amount: 1.00, // Placeholder, usually overridden by Plan
            duration: 15, // Seconds
            valid_plans: createdPlans, // LINK TO ALL NEW PLANS
            is_active: true,
            priority: 10
        });
    }
    console.log(`Seeded ${TASK_TEMPLATES.length} Tasks linked to ${createdPlans.length} Plans.`);

    console.log("Seeding Complete.");
    process.exit(0);
};

seed();
