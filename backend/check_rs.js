const mongoose = require('mongoose');
const connectDB = require('./kernel/database');

const checkStatus = async () => {
    try {
        await connectDB();
        const admin = mongoose.connection.db.admin();
        const status = await admin.command({ replSetGetStatus: 1 });
        console.log('--- RS STATUS ---');
        console.log(JSON.stringify(status, null, 2));

        const isMaster = await admin.command({ isMaster: 1 });
        console.log('--- IS MASTER ---');
        console.log(JSON.stringify(isMaster, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStatus();
