const connectDB = require('./kernel/database');
const dotenv = require('dotenv');
dotenv.config();

console.log('--- TESTING KERNEL/DATABASE.JS ---');
async function run() {
    console.log('Calling connectDB...');
    await connectDB();
    console.log('Returned from connectDB');
    process.exit(0);
}

run();
