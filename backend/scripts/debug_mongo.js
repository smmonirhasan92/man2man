const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
    try {
        console.log('1. Connecting...');
        console.log('URI:', process.env.MONGO_URI ? 'FOUND' : 'MISSING');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('2. Connected!');
        await mongoose.disconnect();
        console.log('3. Disconnected.');
    } catch (e) {
        console.error(e);
    }
}
test();
