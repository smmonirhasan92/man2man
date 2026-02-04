const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../modules/user/UserModel');
const UserPlan = require('../modules/plan/UserPlanModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // 1. Find User test55
        let user = await User.findOne({ username: 'test55' });
        if (!user) {
            console.log('User test55 not found. Creating...');
            user = await User.create({
                username: 'test55',
                email: 'test55@example.com',
                password: 'password123', // You might want to hash this if your model hooks don't
                fullName: 'Test User 55',
                primary_phone: '+15550005555',
                country: 'USA',
                wallet: { main: 10000, game: 5000 }
            });
            console.log('Created User test55');
        }

        // 2. Find User Plans
        const plans = await UserPlan.find({ userId: user._id });
        console.log(`Found ${plans.length} plans.`);

        for (const plan of plans) {
            let updated = false;

            if (!plan.syntheticPhone) {
                // Generate Phone
                const areaCode = Math.floor(Math.random() * (999 - 200) + 200);
                const prefix = Math.floor(Math.random() * (999 - 200) + 200);
                const line = Math.floor(Math.random() * 9000 + 1000);
                plan.syntheticPhone = `+1 (${areaCode}) ${prefix}-${line}`;
                updated = true;
                console.log(` - Generated Phone for Plan ${plan.planName}: ${plan.syntheticPhone}`);
            }

            if (!plan.serverIp) {
                plan.serverIp = `104.28.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                updated = true;
                console.log(` - Generated IP for Plan ${plan.planName}: ${plan.serverIp}`);
            }

            if (!plan.serverLocation) {
                plan.serverLocation = 'Virginia, USA';
                updated = true;
            }

            if (updated) {
                await plan.save();
                console.log(` - Saved Plan ${plan._id}`);
            } else {
                console.log(` - Plan ${plan.planName} already has data.`);
            }
        }

        // Also update User profile phone if missing
        if (!user.synthetic_phone && plans.length > 0) {
            user.synthetic_phone = plans[0].syntheticPhone;
            await user.save();
            console.log("Updated User Profile synthetic_phone");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

fixData();
