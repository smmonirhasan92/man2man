const TaskService = require('../modules/task/TaskService');
const TaskAd = require('../modules/task/TaskAdModel');
const PlanService = require('../modules/plan/PlanService');

exports.getTaskStatus = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const limit = await PlanService.getUserDailyLimit(userId);

        const now = new Date();
        const user = await require('../modules/user/UserModel').findById(userId);
        console.log(`[TaskController.getTaskStatus] Lookup userId: ${userId} -> Found: ${!!user}`);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Robust Default if taskData is missing (Schema vs Reality safety)
        const taskData = user.taskData || { lastTaskDate: new Date(0), tasksCompletedToday: 0 };
        const lastDate = taskData.lastTaskDate ? new Date(taskData.lastTaskDate) : new Date(0);
        const isToday = lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth();
        const completedToday = isToday ? taskData.tasksCompletedToday : 0;

        // [NEW] Get Reward Rate & Limit for frontend display
        // DYNAMIC RATE GUARD: Determine rate based on the ACTIVE SESSION (x-usa-identity)
        const identityHeader = req.headers['x-usa-identity'];
        console.log(`[TaskController.getTaskStatus] Headers:`, {
            identity: identityHeader,
            key: req.headers['x-usa-key']
        });

        let rewardPerTask = 0;
        let sessionLimit = 0; // [NEW] Session Specific Limit

        if (identityHeader) {
            const Plan = require('../modules/admin/PlanModel');
            const UserPlan = require('../modules/plan/UserPlanModel'); // lazy load

            // Find the specific plan for this identity
            const activePlan = await UserPlan.findOne({ userId, syntheticPhone: identityHeader, status: 'active' });

            if (activePlan) {
                // Get Session Specific Limit
                sessionLimit = await PlanService.getUserDailyLimit(userId, activePlan._id);

                const planDetails = await Plan.findById(activePlan.planId);
                if (planDetails) {
                    rewardPerTask = planDetails.task_reward;
                }
            }
        } else {
            // Fallback (Display Only - Legacy Behavior)
            sessionLimit = await PlanService.getUserDailyLimit(userId); // Global Sum
            const activePlans = await PlanService.getActivePlans(userId);
            if (activePlans.length > 0) {
                const Plan = require('../modules/admin/PlanModel');
                const planDetails = await Plan.findById(activePlans[0].planId);
                if (planDetails) rewardPerTask = planDetails.task_reward;
            }
        }

        // Use Session Limit if available, else Fallback
        const finalLimit = sessionLimit || limit;

        // [FIX] Return the phone number associated with the ACTIVE SESSION (activePlan) if valid
        // Otherwise fallback to user's default. This ensures Task Center matches Dashboard Header.
        const effectivePhone = (identityHeader && sessionLimit > 0) ? identityHeader : user.synthetic_phone;

        res.json({
            canTask: completedToday < finalLimit,
            completedToday,
            dailyLimit: finalLimit,
            rewardPerTask,
            nextReset: 'Midnight UTC',
            syntheticPhone: effectivePhone
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const User = require('../modules/user/UserModel');
        const user = await User.findById(userId);

        console.log(`[TaskController] User Lookup: ID=${userId}, Found=${!!user}, Country=${user?.country}`);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Removed Strict Country Check for Beta
        if (!user.country) {
            console.warn(`[Warning] User ${userId} has no country set.`);
        }

        // Fetch available tasks (Context Aware)
        // DYNAMIC SESSION:
        const identityHeader = req.headers['x-usa-identity'];
        let planId = null;

        if (identityHeader) {
            const UserPlan = require('../modules/plan/UserPlanModel');
            const activePlan = await UserPlan.findOne({ userId, syntheticPhone: identityHeader, status: 'active' });
            if (activePlan) {
                planId = activePlan.planId;
                console.log(`[DEBUG] TaskController: Resolved PlanID=${planId} for Identity=${identityHeader}`);
            } else {
                console.log(`[DEBUG] TaskController: No Active Plan found for Identity=${identityHeader}`);
            }
        }

        console.log(`[DEBUG] TaskController: Calling getAvailableTasks with planId=${planId}`);
        const tasks = await TaskService.getAvailableTasks(userId, planId);
        console.log(`[DEBUG] TaskController: Tasks found=${tasks.length}`);
        res.json(tasks);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', debug_error: err.message, stack: err.stack });
    }
};

exports.generateKey = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const User = require('../modules/user/UserModel');
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate Fresh Key
        const key = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

        // Save as current valid access key
        user.synthetic_phone = key;
        await user.save();

        console.log(`[TaskController] Generated Key for ${userId}: ${key}`);
        res.json({ key });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.startTask = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { taskId } = req.body;

        const result = await TaskService.startTask(userId, taskId);
        res.json(result);

    } catch (err) {
        console.error("Start Task Error:", err);
        res.status(500).json({ message: 'Failed to start task session' });
    }
};

exports.verifyConnection = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { planId, syntheticPhone } = req.body;

        // Verify User Ownership
        const UserPlan = require('../modules/plan/UserPlanModel'); // lazy load
        const validPlan = await UserPlan.findOne({
            userId,
            _id: planId,
            syntheticPhone: syntheticPhone,
            status: 'active'
        });

        if (!validPlan) {
            return res.status(403).json({ message: "Verification Failed: Plan not active or number mismatch." });
        }

        // [OPTIONAL] Log the login event
        console.log(`[TaskController] Connection Verified for ${userId} on ${syntheticPhone}`);

        res.json({ message: "Connection Verified", verified: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Verification Error" });
    }
};

exports.processTask = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { taskId } = req.body;
        const usaKey = req.headers['x-usa-key'];

        console.log(`[TaskController] Process Request: User=${userId}, Key=${usaKey}`);

        // 1. Security Check
        // [MODIFIED] Multi-Server: We allow TaskService to validate the key against plans
        if (!usaKey) {
            return res.status(403).json({ error_code: 'INVALID_SECURITY_KEY', message: 'Missing USA Key' });
        }

        // 2. Process Logic
        const result = await TaskService.processTask(userId, taskId, usaKey);
        res.json(result);

    } catch (err) {
        console.error("Process Error:", err);
        res.status(400).json({ message: err.message || 'Task Processing Failed' });
    }
};

exports.claimTask = async (req, res) => {
    try {
        // 1. Identification (Primary Login ID)
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { taskId } = req.body;

        // 2. Session Security (USA Key = Password)
        const usaKey = req.headers['x-usa-key'];

        console.log(`[TaskController] Claim Request: UserID=${userId}, Key=${usaKey ? usaKey.substring(0, 8) + '...' : 'Missing'}`);

        // 3. Lookup User (Wallet/Plan Owner)
        // const User = require('../modules/user/UserModel');
        // const user = await User.findById(userId);
        // if (!user) return res.status(404).json({ message: 'User not found.' });

        // 4. Validate Session Key (USA Number)
        if (!usaKey) {
            return res.status(403).json({
                error_code: 'INVALID_SECURITY_KEY',
                message: 'Security Verification Failed. Missing USA Key.'
            });
        }

        // 5. Credit Reward (Plan Logic)
        // TaskService handles ALL wallet updates, transactions, and logic.
        const result = await TaskService.completeTask(userId, taskId, "CLAIM_REWARD", usaKey);

        // Success!
        res.json(result);

    } catch (err) {
        console.error("Claim Error:", err);
        res.status(400).json({ message: err.message || 'Task Claim Failed' });
    }
};

exports.submitTask = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { taskId, answer } = req.body;

        const result = await TaskService.completeTask(userId, taskId, answer);
        res.json(result);

    } catch (err) {
        console.error(err);
        if (err.message === 'Incorrect Answer') {
            return res.status(400).json({ message: 'Incorrect Answer' });
        }
        res.status(400).json({ message: err.message || 'Task Submission Failed' });
    }
};

// [NEW] Seed Default Tasks (One-time use)
exports.seedTasks = async (req, res) => {
    try {
        const tasks = [
            // Standard Ad Views (5-10 seconds)
            { title: 'Watch Premium Ad', url: 'https://youtube.com', duration: 10, reward_amount: 2.0, type: 'ad_view', server_id: 'SERVER_01' },
            { title: 'Visit Sponsor Site', url: 'https://google.com', duration: 5, reward_amount: 1.5, type: 'ad_view', server_id: 'SERVER_01' },
            { title: 'Check New Offer', url: 'https://amazon.com', duration: 8, reward_amount: 1.8, type: 'ad_view', server_id: 'SERVER_01' },

            // High Value Tasks
            { title: 'Complete Survey', url: 'https://surveymonkey.com', duration: 30, reward_amount: 5.0, type: 'ad_view', server_id: 'SERVER_01' },
            { title: 'Install App (Demo)', url: 'https://play.google.com', duration: 15, reward_amount: 3.5, type: 'ad_view', server_id: 'SERVER_01' },

            // Interactive
            { title: 'Rate Us 5 Stars', url: 'https://facebook.com', duration: 12, reward_amount: 2.5, type: 'review', server_id: 'SERVER_01' },
            { title: 'Share on Twitter', url: 'https://twitter.com', duration: 10, reward_amount: 2.0, type: 'social', server_id: 'SERVER_01' },

            // Filler Tasks
            { title: 'Daily Check-in', url: 'https://man2man.vercel.app', duration: 5, reward_amount: 1.0, type: 'ad_view', server_id: 'SERVER_01' },
            { title: 'View Promotion', url: 'https://netflix.com', duration: 8, reward_amount: 1.5, type: 'ad_view', server_id: 'SERVER_01' },
            { title: 'Browse Catalog', url: 'https://ebay.com', duration: 15, reward_amount: 2.2, type: 'ad_view', server_id: 'SERVER_01' }
        ];

        for (const t of tasks) {
            // Create if not exists (using Title as unique key for seeding)
            await TaskAd.findOneAndUpdate({ title: t.title }, t, { upsert: true, new: true, setDefaultsOnInsert: true });
        }

        res.json({ message: 'Tasks Seeded Successfully', count: tasks.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
