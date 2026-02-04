const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://127.0.0.1:27018/admin'; // Connect to admin to list DBs

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log("Databases:", dbs.databases.map(d => d.name));

        const targetDB = 'usa-affiliate'; // Expected
        const collections = await mongoose.connection.useDb(targetDB).db.listCollections().toArray();
        console.log(`Collections in ${targetDB}:`, collections.map(c => c.name));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
diagnose();
