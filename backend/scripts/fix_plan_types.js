const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Plan = require('../modules/admin/PlanModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const updatePlans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const result = await Plan.updateMany(
            { type: 'vip' },
            { $set: { type: 'server' } }
        );

        console.log(`Updated ${result.modifiedCount} plans from 'vip' to 'server'`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

updatePlans();
