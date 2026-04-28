require('dotenv').config();
const mongoose = require('mongoose');
const PlanController = require('../controllers/PlanController');

async function runSeed() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const req = {};
        const res = {
            json: (data) => console.log('Response:', data),
            status: (code) => {
                console.log('Status:', code);
                return res;
            }
        };

        console.log('Executing seedDefaultPlans...');
        await PlanController.seedDefaultPlans(req, res);
        
        console.log('Seeding completed. Disconnecting...');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

runSeed();
