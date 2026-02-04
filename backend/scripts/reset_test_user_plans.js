const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../modules/user/UserModel');
const UserPlan = require('../modules/plan/UserPlanModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function resetUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const phone = '01755555555';
        const user = await User.findOne({ primary_phone: phone });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log(`User found: ${user._id}`);

        // 1. Check Plans
        const plans = await UserPlan.find({ userId: user._id });
        console.log(`Found ${plans.length} UserPlans.`);
        plans.forEach(p => console.log(` - Plan: ${p.planName} (${p.status})`));

        // 2. Delete Plans
        await UserPlan.deleteMany({ userId: user._id });
        console.log('Deleted all UserPlans.');

        // 3. Reset User State
        user.taskData = {
            isActive: false, // Should be false now
            tasksCompletedToday: 0,
            lastTaskDate: null,
            currentTask: { taskId: null, startTime: null }
        };
        // Reset identity to simulate fresh user
        user.synthetic_phone = null;

        await user.save();
        console.log('User taskData and identity reset.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

resetUser();
