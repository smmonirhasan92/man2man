const mongoose = require('mongoose');
require('dotenv').config();

async function resetSystem() {
    try {
        console.log("Connecting to Production DB V2...");
        // Use MONGODB_URI to match the server's .env file
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected Successfully.");

        // Clear Users (except super admin)
        const userRes = await mongoose.connection.collection('users').deleteMany({ role: { $ne: 'super_admin' } });
        console.log(`Deleted ${userRes.deletedCount} users.`);

        // Clear Transactions
        const txRes = await mongoose.connection.collection('transactions').deleteMany({});
        console.log(`Deleted ${txRes.deletedCount} transactions.`);

        console.log("--- PRODUCTION RESET COMPLETE ---");
    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetSystem();
