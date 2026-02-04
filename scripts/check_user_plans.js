const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const UserPlan = require('./backend/modules/plan/UserPlanModel'); // Corrected path
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected.');

        // This is the user in the screenshots: 01701010101
        // But the previous user was 01700000000. Let's check both or find by recent creation.
        // Wait, the screenshot shows 01701010101 being entered.
        // Let's check 01700000000 as that is the one I promoted. 
        // Or I'll just check ALL users.

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const u of users) {
            console.log(`\nUser: ${u.primary_phone} (${u._id}) Role: ${u.role}`);
            console.log(`  - synthetic_phone: ${u.synthetic_phone}`);
            console.log(`  - wallet:`, u.wallet);

            // Check Plans
            // Note: UserPlanModel might be in modules/plan/UserPlanModel or admin/UserPlanModel
            // I'll assume modules/plan based on previous finds.

            // Try to find plans
            try {
                const plans = await UserPlan.find({ userId: u._id });
                console.log(`  - Plans Found: ${plans.length}`);
                plans.forEach(p => {
                    console.log(`     > PlanID: ${p.planId}, Status: ${p.status}, Synthetic: ${p.syntheticPhone}`);
                });
            } catch (err) {
                console.log('  - Error fetching plans:', err.message);
            }
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
