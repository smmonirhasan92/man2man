const { MongoClient } = require('mongodb');

async function check() {
    const url = 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(url);
    try {
        await client.connect();
        const adminDb = client.db('admin');
        const dbs = await adminDb.admin().listDatabases();

        console.log("CURRENT DATABASES:");
        dbs.databases.forEach(db => console.log(` - ${db.name}`));

        const banned = ['man2man_db', 'man2man_test_admin', 'man2man_test_chain', 'man2man_test_integration'];
        const found = dbs.databases.filter(db => banned.includes(db.name));

        if (found.length > 0) {
            console.error("❌ FAILED: Found lingering databases:", found.map(d => d.name));
        } else {
            console.log("✅ VERIFIED: Environment is clean.");
        }
    } catch (e) { console.error(e); }
    finally { await client.close(); }
}
check();
