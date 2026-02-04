const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('./modules/admin/PlanModel');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGO_URI) dotenv.config();

let uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri.includes('directConnection=true')) {
    uri += (uri.includes('?') ? '&' : '?') + 'directConnection=true';
}

const checkDB = async () => {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('✅ Connected. Fetching Plans...');

        const plans = await Plan.find({}).sort({ unlock_price: 1 });
        console.log(`Found ${plans.length} Plans:`);
        plans.forEach(p => {
            console.log(`- ${p.name}: ৳${p.unlock_price} | Tasks: ${p.daily_limit} | Reward: $${p.task_reward}`);
        });

        // Check for duplicate collections?
        const cols = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections:', cols.map(c => c.name).join(', '));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
