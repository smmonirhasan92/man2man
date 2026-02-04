const mongoose = require('mongoose');

async function check(port) {
    const uri = `mongodb://127.0.0.1:${port}/test?directConnection=true`;
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log(`Port ${port}: UP`);

        // Check if replica set
        const admin = mongoose.connection.db.admin();
        const info = await admin.serverStatus();
        if (info.repl) {
            console.log(`Port ${port}: Replica Set (${info.repl.setName})`);
        } else {
            console.log(`Port ${port}: Standalone`);
        }
        await mongoose.disconnect();
    } catch (e) {
        console.log(`Port ${port}: DOWN or Unreachable (${e.message})`);
    }
}

async function main() {
    await check(27017);
    await check(27018);
}

main();
