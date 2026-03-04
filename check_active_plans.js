const mongoose = require('mongoose');

// Connect to testing database directly for diagnosis
require('./backend/kernel/database')().then(async () => {
    try {
        const UserPlan = require('./backend/modules/plan/UserPlanModel');
        const Plan = require('./backend/modules/admin/PlanModel');

        const activePlans = await UserPlan.find({ status: 'active' });
        console.log('Active plans:', activePlans.length);
        for (let p of activePlans) {
            const plan = await Plan.findById(p.planId);
            console.log('User:', p.userId, 'Server:', plan ? plan.server_id : 'NO_PLAN', 'Phone:', p.syntheticPhone);
        }
    } catch (e) {
        console.error("Diagnosis error:", e);
    } finally {
        mongoose.connection.close();
    }
});
