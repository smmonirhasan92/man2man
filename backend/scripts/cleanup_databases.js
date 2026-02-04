const mongoose = require('mongoose');

const TARGET_DATABASES = [
    'man2man_db',
    'man2man_test_admin',
    'man2man_test_chain',
    'man2man_test_integration'
];

async function cleanup() {
    const mongoUri = 'mongodb://127.0.0.1:27017';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);

    // We connect to the 'admin' DB to be able to list/drop others if needed, 
    // or we can connect to each target individually and drop it.
    // Connecting to base URI usually lets us switch or is often enough for admin ops in local dev.
    // Strategy: Connect to each DB specifically and call dropDatabase().

    for (const dbName of TARGET_DATABASES) {
        try {
            console.log(`\nTARGET: ${dbName}`);
            const connection = await mongoose.createConnection(`${mongoUri}/${dbName}`).asPromise();

            // connection.db is the native MongoDB driver database object
            console.log(`  Connected to ${dbName}. Dropping...`);
            await connection.dropDatabase();
            console.log(`  ✅ DROPPED: ${dbName}`);

            await connection.close();
        } catch (err) {
            console.log(`  ⚠️ Skipped/Error for ${dbName}: ${err.message}`);
        }
    }

    console.log('\n---------------------------------------------------');
    console.log('Verifying remaining databases...');

    // Connect to admin to list databases
    const adminConn = await mongoose.createConnection(`${mongoUri}/admin`).asPromise();
    const adminDb = adminConn.db.admin();
    const listResult = await adminDb.listDatabases();

    console.log('Current Databases:');
    listResult.databases.forEach(db => {
        const marker = db.name === 'universal_game_core_v1' ? ' <--- [ACTIVE]' : '';
        console.log(` - ${db.name} ${marker}`);
        if (TARGET_DATABASES.includes(db.name)) {
            console.error(`  ❌ ERROR: ${db.name} still exists!`);
        }
    });

    await adminConn.close();
    console.log('\nCleanup Complete.');
    process.exit(0);
}

cleanup();
