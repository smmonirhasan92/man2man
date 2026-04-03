const mongoose = require('mongoose');

async function init() {
    try {
        // [FIX] Try 'mongodb' host for Docker, then fallback to 127.0.0.1 for native.
        const dbHost = process.env.MONGODB_HOST || (process.env.NODE_ENV === 'production' ? 'mongodb' : '127.0.0.1');
        console.log(`Connecting to ${dbHost} to initiate replica set...`);
        await mongoose.connect(`mongodb://${dbHost}:27017/admin?directConnection=true`);
        const admin = mongoose.connection.db.admin();

        console.log("Initiating Replica Set...");
        const res = await admin.command({ replSetInitiate: {} });
        console.log("Result:", res);
    } catch (err) {
        if (err.message.includes("already initialized")) {
            console.log("Replica set already initialized.");
        } else {
            console.error("Error:", err);
        }
    } finally {
        await mongoose.disconnect();
    }
}

init();
