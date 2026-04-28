const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://m2m-mongodb-test:27017/universal_game_core_docker?replicaSet=rs0');
    
    const db = mongoose.connection.collection('users');
    
    console.log('=== Current Indexes ===');
    const indexes = await db.indexes();
    indexes.forEach(idx => {
        console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} sparse=${idx.sparse} unique=${idx.unique}`);
    });
    
    // Drop ALL problematic non-sparse unique indexes and rebuild
    const toDrop = ['primary_phone_1', 'email_1', 'referralCode_1', 'username_1', 'synthetic_phone_1'];
    
    for (const indexName of toDrop) {
        try {
            await db.dropIndex(indexName);
            console.log(`✅ Dropped: ${indexName}`);
        } catch(e) {
            if (e.code === 27) {
                console.log(`ℹ️  Not found (skip): ${indexName}`);
            } else {
                console.log(`⚠️  Could not drop ${indexName}: ${e.message}`);
            }
        }
    }
    
    // Recreate all indexes as sparse + unique (safe for null values)
    console.log('\n=== Recreating indexes as sparse ===');
    
    await db.createIndex({ primary_phone: 1 }, { unique: true, sparse: true, name: 'primary_phone_1' });
    console.log('✅ Created: primary_phone_1 (unique+sparse)');
    
    await db.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'email_1' });
    console.log('✅ Created: email_1 (unique+sparse)');
    
    await db.createIndex({ username: 1 }, { unique: true, sparse: true, name: 'username_1' });
    console.log('✅ Created: username_1 (unique+sparse)');
    
    await db.createIndex({ referralCode: 1 }, { unique: true, sparse: true, name: 'referralCode_1' });
    console.log('✅ Created: referralCode_1 (unique+sparse)');
    
    await db.createIndex({ synthetic_phone: 1 }, { sparse: true, name: 'synthetic_phone_1' });
    console.log('✅ Created: synthetic_phone_1 (sparse)');
    
    console.log('\n=== Final Indexes ===');
    const finalIndexes = await db.indexes();
    finalIndexes.forEach(idx => {
        console.log(`  ${idx.name}: sparse=${!!idx.sparse} unique=${!!idx.unique}`);
    });
    
    console.log('\n🎉 All indexes fixed! Registration should now work.');
    process.exit(0);
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
