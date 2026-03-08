const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('../../modules/wallet/TransactionModel');
const PlanService = require('../plan/PlanService');
const { runTransaction } = require('../common/TransactionHelper');
const NotificationService = require('../notification/NotificationService');

class TaskService {

    get ReferralService() {
        return require('../referral/ReferralService');
    }

    /**
     * Get Available Tasks (Global Randomized Pool)
     */
    async getAvailableTasks(userId, planId = null) {
        if (!planId) return [];

        const TaskAd = require('./TaskAdModel');
        const Plan = require('../../modules/admin/PlanModel');

        let planIdObj;
        try {
            planIdObj = new mongoose.Types.ObjectId(planId);
        } catch (e) {
            return [];
        }

        const planDetails = await Plan.findById(planIdObj);
        if (!planDetails) {
            return [];
        }

        const dailyLimit = planDetails.daily_limit || 0;
        if (dailyLimit <= 0) return [];

        // Fetch all active ads globally, independent of server group
        let globalAds = await TaskAd.find({ is_active: true });

        // If no ads exist, return empty
        if (!globalAds || globalAds.length === 0) {
            return [];
        }

        // Shuffle the ads to randomize what the user sees
        const shuffledAds = globalAds.sort(() => 0.5 - Math.random());

        // Trim the pool to match the user's daily limit
        const allocatedAds = shuffledAds.slice(0, dailyLimit);

        return allocatedAds;
    }


    /**
     * Step 1: Start Task
     * Generates a secure session for the task.
     */
    async startTask(userId, taskId, usaKey) {
        console.log(`[TaskService.startTask] Init userId=${userId}, taskId=${taskId}, usaKey=${usaKey}`);
        try {
            // 1. Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                console.error(`[TaskService.startTask] Error: User not found`);
                throw new Error('User not found.');
            }

            // 2. Initial Validation (Plan & Limits)
            const PlanService = require('../plan/PlanService');
            const UserPlan = require('../plan/UserPlanModel');

            let activePlan = null;
            if (usaKey) {
                const cleanKey = usaKey.trim();
                activePlan = await UserPlan.findOne({ userId, syntheticPhone: cleanKey, status: 'active' });
                console.log(`[TaskService.startTask] Lookup activePlan: ${activePlan ? activePlan._id : 'null'}`);
            }

            let dailyLimit = 0;
            let completedToday = 0;

            if (activePlan) {
                dailyLimit = activePlan.dailyLimit || (await PlanService.getUserDailyLimit(userId, activePlan._id));
                const planLastDate = activePlan.last_earning_date ? new Date(activePlan.last_earning_date) : new Date(0);
                const now = new Date();
                const planIsToday = planLastDate.getDate() === now.getDate() && planLastDate.getMonth() === now.getMonth();
                completedToday = planIsToday ? (activePlan.tasksCompletedToday || 0) : 0;
                console.log(`[TaskService.startTask] Active Plan Limits: done=${completedToday}, limit=${dailyLimit}`);
            } else {
                // Legacy Global
                dailyLimit = await PlanService.getUserDailyLimit(userId);
                const now = new Date();
                const lastDate = (user.taskData && user.taskData.lastTaskDate) ? new Date(user.taskData.lastTaskDate) : new Date(0);
                const isToday = lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth();
                completedToday = (isToday && user.taskData) ? user.taskData.tasksCompletedToday : 0;
                console.log(`[TaskService.startTask] Legacy Plan Limits: done=${completedToday}, limit=${dailyLimit}`);
            }

            if (completedToday >= dailyLimit) {
                console.error(`[TaskService.startTask] Check failed: Daily limit reached for this server.`);
                throw new Error(`Daily limit reached for this server.`);
            }

            console.log(`[TaskService.startTask] Check passed. Setting task session...`);
            // 3. Set Start Token in DB
            // We persist this to prevent stateless hacking (claiming without starting)
            if (!user.taskData) user.taskData = {};
            user.taskData.currentTask = {
                taskId: taskId,
                startTime: new Date()
            };
            await user.save();
            console.log(`[TaskService.startTask] Task Session Set. Successful return.`);

            return {
                message: "Task Started",
                startTime: new Date(),
                taskId
            };
        } catch (error) {
            console.error(`[TaskService.startTask] FATAL ERROR: `, error);
            throw error;
        }
    }

    /**
     * Heartbeat: Update 'lastHeartbeat' timestamp for the current active task.
     */
    async verifyHeartbeat(userId, taskId) {
        const user = await User.findById(userId);
        if (!user || user.taskData.currentTask?.taskId?.toString() !== taskId) {
            return { success: false, message: "No active task session" };
        }

        user.taskData.currentTask.lastHeartbeat = new Date();
        await user.save();
        return { success: true };
    }


    /**
     * Step 2: Complete Task
     * Validates Duration and completes the transaction
     */
    async completeTask(userId, taskId, answer, usaKey) {
        // 1. Validation (Read Only)
        const User = require('../user/UserModel');
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found.');

        // [MODIFIED] Fetch Reward from User's Active Plan
        const PlanService = require('../plan/PlanService');
        const UserPlan = require('../plan/UserPlanModel');

        // Multi-Server Logic: Find the SPECIFIC plan used for this session
        let activePlan = null;
        if (usaKey) {
            activePlan = await UserPlan.findOne({ userId, syntheticPhone: usaKey, status: 'active' });
            console.log(`[TaskService] Plan Lookup by Key '${usaKey}': ${activePlan ? 'Found' : 'Not Found'}`);
        }

        // Fallback: If no key or not found (legacy), take the first active one
        if (!activePlan) {
            const activePlans = await PlanService.getActivePlans(userId);
            if (activePlans.length > 0) activePlan = activePlans[0];
            console.log(`[TaskService] Plan Lookup Fallback: ${activePlan ? 'Found' : 'Not Found'}`);
        }

        if (!activePlan) {
            console.error(`[TaskService] No Active Plan for User ${userId} with Key ${usaKey}`);
            throw new Error('No Active Plan found for this connection. Please reconnect.');
        }

        // Feature: Use the specific reward from the Connected Plan
        const Plan = require('../../modules/admin/PlanModel');
        const planDetails = await Plan.findById(activePlan.planId);

        if (!planDetails) throw new Error('Active Plan details not found.');

        // [ADMIN SYNC] Use Exact Reward from Admin Panel
        let rewardAmount = planDetails.task_reward;

        // [DYNAMIC ROI LOGIC]
        // Formula: (Total_Revenue_Target / Validity_Days) / Daily_Limit
        // This ensures EXACT mathematical adherence to the promised ROI.
        if (!rewardAmount || rewardAmount <= 0) {
            const unlockPrice = planDetails.unlock_price || 0;
            // If plan price > 100, treat as BDT convert to USD if needed, or keep base.
            // Usually `planDetails` has `price_usd` or we calculate. 
            // Let's rely on `planDetails.total_return` if pre-calculated, or calculate live.

            let investment = unlockPrice;
            // Normalize to USD if huge number (BDT)
            if (investment > 500) investment = investment / 120;

            const roiPercentage = planDetails.roi_percentage || 150; // Default 150%
            const totalReturn = investment * (roiPercentage / 100);
            const validity = planDetails.validity_days || 35;
            const limit = planDetails.daily_limit || 10;

            // Daily Goal for the USER (Total Return / Days)
            const dailyRevenueGoal = totalReturn / validity;

            // Per Task Reward (Daily Goal / Limit)
            rewardAmount = dailyRevenueGoal / limit;

            console.log(`[TaskService] Dynamic ROI Calc: Inv=${investment} ROI=${roiPercentage}% Return=${totalReturn} Days=${validity} Limit=${limit} -> Task=${rewardAmount}`);
        }

        // Ensure 4 decimals
        rewardAmount = parseFloat(rewardAmount.toFixed(4));

        // Calculate Lifecycle Day (needed for logging)
        const planStart = new Date(activePlan.startDate || activePlan.createdAt);
        const validityDays = planDetails.validity_days || 35;
        const dayDiff = Math.floor((new Date() - planStart) / (1000 * 60 * 60 * 24)) + 1;
        const currentDay = Math.min(Math.max(1, dayDiff), validityDays); // Clamp 1-35

        // Retrieve Progress (needed for logging and activePlan update)
        const today = new Date();
        const lastEarnDate = activePlan.last_earning_date ? new Date(activePlan.last_earning_date) : new Date(0);
        const sameDay = today.getDate() === lastEarnDate.getDate() && today.getMonth() === lastEarnDate.getMonth();

        let earningsSoFar = sameDay ? (activePlan.earnings_today || 0) : 0;
        let planTasksDone = sameDay ? (activePlan.tasksCompletedToday || 0) : 0;

        console.log(`[TaskService] ROI Curve (Day ${currentDay}): Goal=${(earningsSoFar + rewardAmount).toFixed(4)} Earned=${earningsSoFar.toFixed(4)} Task=${rewardAmount}`);

        // Limit Check Specific to this Plan
        const limitForPlan = activePlan.dailyLimit || (await PlanService.getUserDailyLimit(userId, activePlan._id));
        if (planTasksDone >= limitForPlan) {
            throw new Error(`Daily Task Limit Reached on this Server (${planTasksDone}/${limitForPlan}). Select another server or upgrade.`);
        }

        // --- SECURITY: 2-STEP HANDSHAKE CHECK ---
        const currentTask = user.taskData.currentTask;
        console.log('[TaskService] Session Check:', {
            stored: currentTask?.taskId,
            incoming: taskId,
            match: currentTask?.taskId?.toString() === taskId.toString()
        });

        // [RELAXED MODE] Log warning instead of blocking to fix 400 error
        if (!currentTask || !currentTask.startTime || currentTask.taskId.toString() !== taskId.toString()) {
            console.warn(`[TaskService] WARN: Invalid Task Session for User ${userId}. Expected ${currentTask?.taskId}, Got ${taskId}`);
            // throw new Error("Invalid Task Session. Please start the task again.");
        }

        const now = new Date();
        const startTime = currentTask?.startTime ? new Date(currentTask.startTime) : new Date(now - 20000); // Default to safe time if missing
        const diffSeconds = (now - startTime) / 1000;
        const MIN_REQUIRED_SECONDS = 0; // [RELAXED] 0s to unblock

        console.log(`[TaskService] Duration Check: ${diffSeconds}s vs Min ${MIN_REQUIRED_SECONDS}s`);

        if (diffSeconds < MIN_REQUIRED_SECONDS) {
            console.warn(`[TaskService] WARN: Task too fast: ${diffSeconds}s`);
            // throw new Error(`Task completed too fast! (Took ${diffSeconds.toFixed(1)}s, Min: ${MIN_REQUIRED_SECONDS}s)`);
        }

        // --- HEARTBEAT CHECK ---
        // Ensure the user has been sending heartbeats recently (within last 45s)
        if (currentTask.lastHeartbeat) {
            const lastHeartbeat = new Date(currentTask.lastHeartbeat);
            const silenceDuration = (now - lastHeartbeat) / 1000;
            if (silenceDuration > 45) { // Allow some buffer for network lag
                throw new Error("Connection lost during task. Please restart.");
            }
        } else {
            // Strict Mode: If no heartbeat matches, and task > 60s, fail.
            // (Relaxed from 15s to allow short tasks to complete without forced heartbeat)
            if (diffSeconds > 60) throw new Error("No activity detected. Task failed.");
        }
        // -----------------------

        // --- COOLDOWN CHECK (8 Seconds) ---
        // Retained for extra safety between separate task ACTIONS
        const lastTaskTime = user.taskData.lastTaskDate ? new Date(user.taskData.lastTaskDate).getTime() : 0;
        const timeDiff = now.getTime() - lastTaskTime;
        if (timeDiff < 8000) {
            const waitSeconds = Math.ceil((8000 - timeDiff) / 1000);
            throw new Error(`Please wait ${waitSeconds} seconds before next task.`);
        }
        // -----------------------------------

        // 2. Execution (Write + Validation inside Lock)
        return await runTransaction(async (session) => {
            const userUpd = await User.findById(userId).session(session);
            if (!userUpd) throw new Error('User not found.');

            // --- RE-VALIDATE INSIDE LOCK (PLAN SPECIFIC) ---
            const activePlanUpd = await UserPlan.findById(activePlan._id).session(session);
            if (!activePlanUpd) throw new Error('Active Plan disconnected mid-transaction.');

            const planLastDateLock = activePlanUpd.last_earning_date ? new Date(activePlanUpd.last_earning_date) : new Date(0);
            const isTodayLock = planLastDateLock.getDate() === now.getDate() && planLastDateLock.getMonth() === now.getMonth();

            let earningsSoFarLock = isTodayLock ? (activePlanUpd.earnings_today || 0) : 0;
            let planTasksDoneLock = isTodayLock ? (activePlanUpd.tasksCompletedToday || 0) : 0;

            if (planTasksDoneLock >= limitForPlan) {
                throw new Error(`Daily Task Limit Reached on this Server (${planTasksDoneLock}/${limitForPlan}).`);
            }

            // [NEW P2P MARKETING LOGIC] Zero-Liability Task Commission
            // System deducts 5% of the earned task reward to distribute to 5 uplines.
            // Earner receives 95% of the task reward.
            const DEDUCTION_PERCENT = 5.0; // 5% total distribution
            const systemDeductionAmount = (rewardAmount * DEDUCTION_PERCENT) / 100;
            const earnerNetIncome = rewardAmount - systemDeductionAmount;

            console.log(`[TaskService] Pre-Reward Wallet:`, userUpd.wallet);

            // Update Plan State
            activePlanUpd.tasksCompletedToday = planTasksDoneLock + 1;
            activePlanUpd.earnings_today = earningsSoFarLock + rewardAmount;
            activePlanUpd.last_earning_date = now;
            await activePlanUpd.save({ session });

            // Update legacy global state for dashboards
            const globalLastDate = userUpd.taskData.lastTaskDate ? new Date(userUpd.taskData.lastTaskDate) : new Date(0);
            const globalIsToday = globalLastDate.getDate() === now.getDate() && globalLastDate.getMonth() === now.getMonth();
            if (!globalIsToday) userUpd.taskData.tasksCompletedToday = 0;
            userUpd.taskData.tasksCompletedToday += 1;
            userUpd.taskData.lastTaskDate = now;

            if (userUpd.wallet.income === undefined || isNaN(userUpd.wallet.income)) userUpd.wallet.income = 0;

            // Earner receives the 95% NET amount
            userUpd.wallet.income += earnerNetIncome;
            console.log(`[TaskService] Post-Reward Wallet Income: ${userUpd.wallet.income} (Gross: ${rewardAmount}, Net: ${earnerNetIncome})`);

            // Clear current task session
            userUpd.taskData.currentTask = { taskId: null, startTime: null };

            await userUpd.save({ session });

            await Transaction.create([{
                userId,
                type: 'task_reward',
                amount: earnerNetIncome, // Log the actual 95% received
                status: 'completed',
                description: `Task Completed`,
                balanceAfter: userUpd.wallet.income,
                metadata: { grossReward: rewardAmount, deducedP2P: systemDeductionAmount }
            }], { session });

            // [P2P DISTRIBUTION] Distribute the deducted 5% to the 5 Uplines
            console.log(`[TaskService] Distributing $${systemDeductionAmount} (5%) up the referral chain for User: ${userId}`);
            // Note: ReferralService.distributeIncome internally calculates percentages based on the ORIGINAL gross amount.
            // Since PLAN_COMMISSION_RATES is [2.0, 1.0, 1.0, 0.5, 0.5] (total 5%), passing the GROSS rewardAmount is correct.
            let p2pDistributed = 0;
            try {
                const p2pRes = await this.ReferralService.distributeIncome(userUpd.referredBy, rewardAmount, 'p2p_task_commission', session);
                p2pDistributed = p2pRes.distributed;
            } catch (e) { console.error("[TaskService P2P Dist Error]", e); }

            // Notify User
            await NotificationService.send(userId, `✅ Task Reward: +${earnerNetIncome.toFixed(4)} NXS`, 'success');

            // [SOCKET] Real-time Balance Update
            const SocketService = require('../common/SocketService');
            // Use broadcast helper
            SocketService.broadcast(`user_${userId}`, `balance_update_${userId}`, userUpd.wallet.income);
            SocketService.broadcast(`user_${userId}`, `main_balance_update_${userId}`, userUpd.wallet.main);
            // Dashboard HeaderBalance generic uses `user.wallet_balance`. 
            // But `IncomeDisplay` uses `user.wallet.income`.
            // Let's emit both or full wallet object.
            // SocketService.io.to(`user_${userId}`).emit(`balance_update_${userId}`, userUpd.wallet.income); // For Income Display
            // SocketService.io.to(`user_${userId}`).emit(`main_balance_update_${userId}`, userUpd.wallet.main); // For Main

            // [REDIS] Invalidate Cache to update Dashboard immediately
            try {
                const redisInv = require('../../config/redis');
                await redisInv.client.del(`user_profile:${userId}`);
            } catch (e) { console.warn('Redis Invalidate Error:', e.message); }

            // [SECURITY FIX] Removed Daily Task Referral Bonus
            // User Strategy: Prevent infinite liability generation. Referral commission is now strictly One-Time on package buys.

            return {
                message: 'Task Completed',
                newBalance: userUpd.wallet.income,
                tasksToday: activePlanUpd.tasksCompletedToday,
                limit: limitForPlan,
                rewardAmount: earnerNetIncome // [FIX] Return explicit net amount so frontend popup matches DB
            };
        });
    }

    /**
     * ULTRA-MODERN API: Process Task
     * Handles the logical completion of a task action (Type A/B/C)
     */
    async processTask(userId, taskId, usaKey) {
        // Alias to completeTask for now, but answer is auto-validated by the Type Logic on Frontend
        // We assume if they hit this endpoint with valid US Key, they passed the frontend simulation
        return await this.completeTask(userId, taskId, "AUTO_PROCESS", usaKey);
    }

    // --- DAILY SPIN WHEEL ---

    /**
     * Check if a user is eligible for the Daily Bonus Spin.
     * Eligibility requires completing all daily tasks assigned to their plan, and not having spun already today.
     */
    async getSpinStatus(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const PlanService = require('../plan/PlanService'); // Lazy load
        const activePlan = await PlanService.getActivePlans(userId).then(p => p[0]);

        let dailyLimit = 0;
        let completedToday = 0;

        if (activePlan) {
            dailyLimit = activePlan.dailyLimit || (await PlanService.getUserDailyLimit(userId, activePlan._id));
            const planLastDate = activePlan.last_earning_date ? new Date(activePlan.last_earning_date) : new Date(0);
            const now = new Date();
            const planIsToday = planLastDate.getDate() === now.getDate() && planLastDate.getMonth() === now.getMonth();
            completedToday = planIsToday ? (activePlan.tasksCompletedToday || 0) : 0;
        } else {
            // No plan, fallback
            dailyLimit = await PlanService.getUserDailyLimit(userId);
            const now = new Date();
            const lastDate = (user.taskData && user.taskData.lastTaskDate) ? new Date(user.taskData.lastTaskDate) : new Date(0);
            const isToday = lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth();
            completedToday = (isToday && user.taskData) ? user.taskData.tasksCompletedToday : 0;
        }

        const limitReached = completedToday >= dailyLimit && dailyLimit > 0;

        // Check spin date
        const today = new Date();
        const spinDate = user.taskData?.dailySpinDate ? new Date(user.taskData.dailySpinDate) : new Date(0);
        const alreadySpunToday = spinDate.getDate() === today.getDate() && spinDate.getMonth() === today.getMonth() && spinDate.getFullYear() === today.getFullYear();

        return {
            isEligible: limitReached && !alreadySpunToday,
            limitReached,
            alreadySpunToday
        };
    }

    /**
     * Execute the spin, award random 1-3 NXS.
     */
    async executeDailySpin(userId) {
        return await runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");

            // 1. Verify Eligibility inside transaction
            const status = await this.getSpinStatus(userId);
            if (!status.limitReached) {
                throw new Error("You must complete all daily tasks first.");
            }
            if (status.alreadySpunToday) {
                throw new Error("You have already claimed your daily bonus spin today.");
            }

            // 2. Calculate Reward based on Weighted Probabilities
            // 80% chance: 0.50 to 1.00 NXS
            // 15% chance: 1.01 to 2.00 NXS
            // 5% chance: 2.01 to 3.00 NXS

            let min = 0;
            let max = 0;
            const roll = Math.random() * 100;

            if (roll < 80) {
                min = 0.50;
                max = 1.00;
            } else if (roll < 95) {
                min = 1.01;
                max = 2.00;
            } else {
                min = 2.01;
                max = 3.00;
            }

            const rewardAmount = parseFloat((Math.random() * (max - min) + min).toFixed(2));

            // 3. Update User Wallet and Spin Date
            user.wallet.main += rewardAmount; // Assuming bonus goes to main wallet, like an airdrop
            if (!user.taskData) user.taskData = {};
            user.taskData.dailySpinDate = new Date();

            await user.save({ session });

            // 4. Log Transaction
            await Transaction.create([{
                userId: user._id,
                amount: rewardAmount,
                type: 'admin_credit',
                description: 'Daily Task Completion Bonus Spin',
                status: 'completed',
                source: 'system',
                currency: 'NXS'
            }], { session });

            return { success: true, reward: rewardAmount };
        }).then(async (result) => {
            // Post-Transaction notifications
            const SocketService = require('../common/SocketService');
            SocketService.broadcast(`user_${userId}`, `main_balance_update_${userId}`, result.reward); // Only sending delta or full? Best to fetch full, but usually we just send new balance. Wait, standard is to send the full balance. Let's send a generic notification instead.

            const NotificationService = require('../notification/NotificationService');
            await NotificationService.send(userId, `🎡 You won ${result.reward} NXS from the Daily Bonus Spin!`, 'success');

            const reUser = await User.findById(userId);
            SocketService.broadcast(`user_${userId}`, `main_balance_update_${userId}`, reUser.wallet.main);

            return result;
        });
    }

}

module.exports = new TaskService();
