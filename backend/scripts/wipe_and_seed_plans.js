require('dotenv').config();
const mongoose = require('mongoose');
const PlanController = require('../controllers/PlanController');

async function wipeAndSeed() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Wipe existing plans via direct collection access
        console.log('Wiping existing plans...');
        await mongoose.connection.db.collection('plans').deleteMany({});
        console.log('Plans wiped.');

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
        
        console.log('Sync completed. Disconnecting...');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

wipeAndSeed();
