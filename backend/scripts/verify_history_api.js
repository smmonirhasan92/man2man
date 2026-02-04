const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// We need a logged in token. 
// Since this is a standalone script, we might need to simulate a login or mock a request.
// Or we can just import the controller and run it with a mock Req/Res object? 
// Importing controller requires DB connection.

const mongoose = require('mongoose');
const historyController = require('../controllers/historyController');
const User = require('../modules/user/UserModel');

async function testHistory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find a user
        const user = await User.findOne();
        if (!user) {
            console.log('No users found to test');
            process.exit(0);
        }

        const req = {
            user: { user: { id: user._id } },
            query: { limit: 10 }
        };

        const res = {
            json: (data) => {
                console.log('--- History Data ---');
                console.log(`Fetched ${data.length} items.`);
                if (data.length > 0) {
                    console.log('Sample Item:', data[0]);
                }
                console.log('Validation: ' + (data.every(i => i.source && i.type && i.amount !== undefined) ? 'PASSED' : 'FAILED'));
            },
            status: (code) => ({ json: (d) => console.log(`Status ${code}:`, d) })
        };

        await historyController.getUnifiedHistory(req, res);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

testHistory();
