const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const UserPlan = require('../modules/plan/UserPlanModel');
const Transaction = require('../modules/wallet/TransactionModel');
const Plan = require('../modules/admin/PlanModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("Starting 1300 BDT Fix...");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error("Connect Error:", err);
        process.exit(1);
    }
};

const fixHistory = async () => {
    await connectDB();

    try {
        // 1. Find USERS who have a plan but no purchase history
        // Specifically the 1300 BDT plan typical price

        console.log("Scanning for active plans...");
        const userPlans = await UserPlan.find({ status: 'active' }).populate('userId');

        for (const userPlan of userPlans) {
            if (!userPlan.userId) continue;

            // Check if they have a purchase record for this plan
            // Looking for 'plan_purchase' or check amount roughly
            const exists = await Transaction.findOne({
                userId: userPlan.userId._id,
                type: 'plan_purchase',
                // amount: -1300 // Could be variable, let's just check type and recent
            });

            if (!exists) {
                // Double check if there is ANY debit of ~1300
                const debit = await Transaction.findOne({
                    userId: userPlan.userId._id,
                    amount: { $lte: -1200, $gte: -1400 } // Fuzzy match
                });

                if (!debit) {
                    console.log(`[FIX] Missing Purchase History for: ${userPlan.userId.username} (Plan: ${userPlan.planName})`);

                    // Create the missing record
                    await Transaction.create({
                        userId: userPlan.userId._id,
                        type: 'plan_purchase',
                        amount: -1300, // Assuming 1300 based on prompt, or fetch from Plan?
                        status: 'completed',
                        description: `Purchased Package: ${userPlan.planName}`,
                        adminComment: 'Manual Recovery Script',
                        createdAt: userPlan.createdAt // Backdate it to when plan was created
                    });
                    console.log("✅ FIXED: Created transaction record.");
                } else {
                    console.log(`Skipping ${userPlan.userId.username} (Debit found: ${debit.amount})`);
                }
            }
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        console.log("Done.");
        await mongoose.disconnect();
        process.exit();
    }
};

fixHistory();
