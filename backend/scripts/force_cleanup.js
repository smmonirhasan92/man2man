const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

const TARGETS = [
    'man2man_db',
    'man2man_test_admin',
    'man2man_test_chain',
    'man2man_test_integration'
];

async function run() {
    try {
        await client.connect();
        console.log("Connected correctly to server");

        const adminDb = client.db('admin');

        console.log("Listing databases BEFORE cleanup...");
        let dbs = await adminDb.admin().listDatabases();
        dbs.databases.forEach(db => console.log(` - ${db.name}`));

        for (const dbName of TARGETS) {
            console.log(`\nAttempting to drop: ${dbName}`);
            const db = client.db(dbName);
            const result = await db.dropDatabase();
            if (result) {
                console.log(`✅ Dropped ${dbName}:`, result);
            } else {
                console.log(`⚠️ Failed to drop ${dbName} (Result: ${result})`);
            }
        }

        console.log("\nListing databases AFTER cleanup...");
        dbs = await adminDb.admin().listDatabases();

        let stillExists = false;
        dbs.databases.forEach(db => {
            console.log(` - ${db.name}`);
            if (TARGETS.includes(db.name)) stillExists = true;
        });

        if (stillExists) {
            console.error("\n❌ FAILED: Some targets still exist.");
        } else {
            console.log("\n✅ SUCCESS: All targets removed.");
        }

    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

run();
