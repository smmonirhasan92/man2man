const mongoose = require('mongoose');

// Cleans up users who registered but have NO emailVerified=true
// These are partial/failed registration entries
async function run() {
    await mongoose.connect('mongodb://m2m-mongodb-test:27017/universal_game_core_docker?replicaSet=rs0');
    const db = mongoose.connection.collection('users');

    // Find users with email but emailVerified is NOT true (failed registrations)
    const partials = await db.find({
        email: { $exists: true, $ne: null },
        emailVerified: { $ne: true }
    }, { projection: { _id: 1, email: 1, fullName: 1, createdAt: 1, emailVerified: 1 } }).toArray();

    if (partials.length === 0) {
        console.log('✅ No partial/failed registrations found.');
    } else {
        console.log(`Found ${partials.length} partial registration(s):`);
        for (const u of partials) {
            console.log(`  - ${u.email} (${u.fullName}) created: ${u.createdAt}`);
            await db.deleteOne({ _id: u._id });
            console.log(`    ✅ Deleted.`);
        }
    }

    // Also fix indexes
    console.log('\n=== Fixing Indexes ===');
    const toDrop = ['primary_phone_1', 'email_1', 'referralCode_1', 'username_1', 'synthetic_phone_1'];
    for (const indexName of toDrop) {
        try {
            await db.dropIndex(indexName);
            console.log(`✅ Dropped: ${indexName}`);
        } catch(e) {
            if (e.code === 27) console.log(`ℹ️  Not found (skip): ${indexName}`);
            else console.log(`⚠️  ${indexName}: ${e.message}`);
        }
    }
    await db.createIndex({ primary_phone: 1 }, { unique: true, sparse: true, name: 'primary_phone_1' });
    await db.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'email_1' });
    await db.createIndex({ username: 1 }, { unique: true, sparse: true, name: 'username_1' });
    await db.createIndex({ referralCode: 1 }, { unique: true, sparse: true, name: 'referralCode_1' });
    await db.createIndex({ synthetic_phone: 1 }, { sparse: true, name: 'synthetic_phone_1' });

    console.log('✅ All indexes rebuilt as sparse.');
    console.log('\n🎉 Done! User can now re-register with the same email.');
    process.exit(0);
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
