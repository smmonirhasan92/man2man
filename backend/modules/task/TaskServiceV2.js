const mongoose = require('mongoose');
const User = require('../../modules/user/UserModel');
const Transaction = require('../../modules/wallet/TransactionModel');
const PlanService = require('../plan/PlanService'); // We can reuse standard PlanService for "getActivePlans"
const { runTransaction } = require('../common/TransactionHelper');
const NotificationService = require('../notification/NotificationService');
const TaskAd = require('./TaskAdModel');
const Plan = require('../admin/PlanModel');

class TaskServiceV2 {

    /**
     * Get Available Tasks (Strict Server Match)
     */
    async getAvailableTasks(userId, planId) {
        if (!planId) return []; // V2 requires a planId

        // 1. Fetch Plan to identify Server Group
        const planDetails = await Plan.findById(planId);
        if (!planDetails) {
            console.warn(`[TaskServiceV2] Plan ${planId} not found.`);
            return [];
        }

        const targetServerId = planDetails.server_id;
        if (!targetServerId) {
            console.warn(`[TaskServiceV2] Plan ${planDetails.name} has no server_id.`);
            return [];
        }

        console.log(`[TaskServiceV2] Serving Tasks for Group: ${targetServerId}`);

        // 2. Fetch Tasks strictly for this server
        const tasks = await TaskAd.find({
            is_active: true,
            server_id: targetServerId
        }).sort({ priority: -1 });

        // 3. Apply Limit
        const dailyLimit = planDetails.daily_limit || 10;
        if (tasks.length > dailyLimit) {
            return tasks.slice(0, dailyLimit);
        }

        return tasks;
    }

    /**
     * Start Task (Standard Session Logic)
     */
    async startTask(userId, taskId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Check Limit
        const dailyLimit = await PlanService.getUserDailyLimit(userId);
        if (dailyLimit <= 0) throw new Error('No active plan');

        const now = new Date();
        const lastDate = user.taskData.lastTaskDate ? new Date(user.taskData.lastTaskDate) : new Date(0);
        const isToday = lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth();
        const completedToday = isToday ? user.taskData.tasksCompletedToday : 0;

        if (completedToday >= dailyLimit) {
            throw new Error('Daily limit reached (V2)');
        }

        // Set Session
        user.taskData.currentTask = {
            taskId: taskId,
            startTime: now,
            lastHeartbeat: now
        };
        await user.save();

        return { message: "Task Started V2", taskId };
    }

    /**
     * Complete Task (High Precision Logic)
     */
    async completeTask(userId, taskId, usaKey) {
        // 1. Identification
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // 2. Locate Active Plan via Key (Strict)
        const UserPlan = require('../plan/UserPlanModel');
        const activeUserPlan = await UserPlan.findOne({ userId, syntheticPhone: usaKey, status: 'active' });

        if (!activeUserPlan) {
            throw new Error(`[V2] Security Error: Connection '${usaKey}' not found or inactive.`);
        }

        // 3. Plan Details & Math
        const planDetails = await Plan.findById(activeUserPlan.planId);
        if (!planDetails) throw new Error('Plan def missing');

        // [PRECISION MATH]
        // Use pre-calculated 'task_reward' if available to avoid runtime drift
        let rewardAmount = planDetails.task_reward;

        if (!rewardAmount) {
            // Fallback: (UnlockPrice * ROI%) / (Days * Limit)
            const price = planDetails.unlock_price;
            const roi = planDetails.roi_percentage / 100;
            const totalReturn = price * roi;
            const days = planDetails.validity_days;
            const limit = planDetails.daily_limit;

            rewardAmount = (totalReturn / days) / limit;
        }

        // Force 4 Decimals
        rewardAmount = parseFloat(rewardAmount.toFixed(4));

        console.log(`[TaskServiceV2] Processing Reward: ${rewardAmount} BDT (Plan: ${planDetails.name})`);

        // 4. Execution
        return await runTransaction(async (session) => {
            const userUpd = await User.findById(userId).session(session);

            // Re-fetch Plan locked for update
            const lockedPlan = await UserPlan.findById(activeUserPlan._id).session(session);
            if (!lockedPlan) throw new Error("Plan validation failed during lock");

            // Check Limits again inside lock
            const dailyLimit = planDetails.daily_limit;
            if (lockedPlan.tasksCompletedToday >= dailyLimit) {
                throw new Error("Daily limit reached (Race Condition Blocked)");
            }

            // Increment
            userUpd.taskData.tasksCompletedToday += 1;
            userUpd.taskData.lastTaskDate = new Date();

            // Wallet Credit
            if (!userUpd.wallet.income) userUpd.wallet.income = 0;
            userUpd.wallet.income += rewardAmount;

            // Clear Session
            userUpd.taskData.currentTask = null;

            await userUpd.save({ session });

            // Update Plan Stats
            lockedPlan.tasksCompletedToday += 1;
            // Reset logic if new day (handled by middleware usually, but good to be safe)
            const lastDate = lockedPlan.last_earning_date ? new Date(lockedPlan.last_earning_date) : new Date(0);
            const isToday = lastDate.getDate() === new Date().getDate();
            if (!isToday) {
                lockedPlan.tasksCompletedToday = 1; // Reset to 1 (current task)
            }

            lockedPlan.earnings_today = (isToday ? lockedPlan.earnings_today : 0) + rewardAmount;
            lockedPlan.last_earning_date = new Date();
            await lockedPlan.save({ session });

            // Transaction Log
            await Transaction.create([{
                userId,
                type: 'task_reward',
                amount: rewardAmount,
                status: 'completed',
                description: `Task V2 Reward (${planDetails.name})`,
                balanceAfter: userUpd.wallet.income
            }], { session });

            // Socket
            const SocketService = require('../common/SocketService');
            SocketService.broadcast(`user_${userId}`, `balance_update_${userId}`, userUpd.wallet.income);

            return {
                success: true,
                newBalance: userUpd.wallet.income,
                reward: rewardAmount
            };
        });
    }
}

module.exports = new TaskServiceV2();
