const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Robust Path Resolution using CWD
const UserPath = path.join(process.cwd(), 'backend/modules/user/UserModel');
const UserPlanPath = path.join(process.cwd(), 'backend/modules/plan/UserPlanModel');

console.log('Loading modules from:', UserPath, UserPlanPath);

const User = require(UserPath);
const UserPlan = require(UserPlanPath);

dotenv.config({ path: path.join(process.cwd(), '.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected to DB');

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const u of users) {
            console.log(`\nUser: ${u.primary_phone} (Role: ${u.role})`);
            console.log(`  - synthetic_phone: '${u.synthetic_phone}'`);

            const plans = await UserPlan.find({ userId: u._id });
            console.log(`  - Active Plans: ${plans.length}`);
            plans.forEach(p => {
                console.log(`    > Plan: ${p.planId} | Status: ${p.status} | Phone: ${p.syntheticPhone}`);
            });

            // AUTO-FIX: If plan exists but synthetic_phone is missing/empty
            if (plans.length > 0 && !u.synthetic_phone) {
                console.log('  [FIXING] Found active plan but missing synthetic_phone. Updating...');
                u.synthetic_phone = plans[0].syntheticPhone;
                await u.save();
                console.log('  [FIXED] Updated user synthetic_phone.');
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
