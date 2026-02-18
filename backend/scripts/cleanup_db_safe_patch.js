const mongoose = require('mongoose');
const TaskLog = require('../modules/task/TaskLogModel'); // Assuming you log tasks here
const UserPlan = require('../modules/plan/UserPlanModel');
const Transaction = require('../modules/wallet/TransactionModel');
const connectDB = require('../kernel/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const RETENTION_DAYS = 38;

async function runCleanup() {
    try {
        console.log("🚀 Connect to MongoDB for Safe-Patch Cleanup...");
        await connectDB();

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
        console.log(`🧹 Cleanup Policy: Deleting data older than ${cutoffDate.toISOString()} (${RETENTION_DAYS} Days)`);

        // 1. Clean Old User Plans (Expired & Old)
        // We ensure we don't delete ACTIVE plans even if they are old (unlikely given 35 day validity, but safety first)
        const planResult = await UserPlan.deleteMany({
            expiryDate: { $lt: cutoffDate },
            status: { $ne: 'active' } // Safety Guard
        });
        console.log(`✅ Removed ${planResult.deletedCount} old UserPlans.`);

        // 2. Clean Old Transactions
        const txResult = await Transaction.deleteMany({
            createdAt: { $lt: cutoffDate }
        });
        console.log(`✅ Removed ${txResult.deletedCount} old Transactions.`);

        // 3. Clean Task Logs (If model exists, generic approach)
        // Note: You might need to check if TaskLog model exists in your codebase.
        // If not, skip or adjust.
        // await TaskLog.deleteMany({ createdAt: { $lt: cutoffDate } });

        console.log("✨ Cleanup Complete. Database Optimized.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Cleanup Error:", err);
        process.exit(1);
    }
}

runCleanup();
