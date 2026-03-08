const mongoose = require('mongoose');

async function checkPlans() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man_db');
        const UserPlan = require('./backend/modules/plan/UserPlanModel');
        const User = require('./backend/modules/user/UserModel');

        const user = await User.findOne({ username: 'Hhasan' });
        if (!user) {
            console.log("User Hhasan not found");
            process.exit(0);
        }

        console.log(`Checking Plans for User: ${user._id} (${user.fullName})`);
        const plans = await UserPlan.find({ userId: user._id });

        console.log(JSON.stringify(plans.map(p => ({
            planName: p.planName,
            status: p.status,
            syntheticPhone: p.syntheticPhone,
            serverIp: p.serverIp,
            createdAt: p.createdAt
        })), null, 2));

        console.log(`\nUser's Profile target_synthetic_phone: ${user.synthetic_phone}`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkPlans();
