const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const UserPlan = require('../modules/plan/UserPlanModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find plans with missing phone
        const plans = await UserPlan.find({
            $or: [
                { syntheticPhone: { $exists: false } },
                { syntheticPhone: null },
                { syntheticPhone: 'Generating...' }
            ]
        });

        console.log(`Found ${plans.length} plans to fix.`);

        for (const plan of plans) {
            const areaCode = Math.floor(Math.random() * (999 - 200) + 200);
            const prefix = Math.floor(Math.random() * (999 - 200) + 200);
            const line = Math.floor(Math.random() * 9000 + 1000);
            plan.syntheticPhone = `+1 (${areaCode}) ${prefix}-${line}`;

            if (!plan.serverIp) {
                plan.serverIp = `104.28.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            }

            if (!plan.serverLocation) {
                plan.serverLocation = 'Virginia, USA';
            }

            await plan.save();
            console.log(` - Fixed Plan ${plan._id}: ${plan.syntheticPhone} [${plan.planName}]`);
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixData();
