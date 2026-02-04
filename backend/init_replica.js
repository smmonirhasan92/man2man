const mongoose = require('mongoose');

async function init() {
    try {
        // Connect directly without replica set option first to run admin command
        await mongoose.connect('mongodb://127.0.0.1:27017/admin?directConnection=true');
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
