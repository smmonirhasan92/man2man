const { MongoClient, ObjectId } = require('mongodb');

async function cleanOrphans() {
    const uri = 'mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0';
    const client = new MongoClient(uri, { directConnection: true });

    try {
        await client.connect();
        const db = client.db('universal_game_core_v1');

        // Get all active user IDs
        const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray();
        const validUserIds = new Set(users.map(u => u._id.toString()));
        console.log(`Found ${validUserIds.size} active users.`);

        // 1. Clean TransactionLedgers
        const allLedgers = await db.collection('transactionledgers').find({}, { projection: { _id: 1, userId: 1 } }).toArray();
        let deletedLedgers = 0;
        const orphanLedgerIds = allLedgers
            .filter(doc => doc.userId && !validUserIds.has(doc.userId.toString()))
            .map(doc => doc._id);
        if (orphanLedgerIds.length > 0) {
            const r = await db.collection('transactionledgers').deleteMany({ _id: { $in: orphanLedgerIds } });
            deletedLedgers = r.deletedCount;
        }
        console.log(`Deleted ${deletedLedgers} orphan records from TransactionLedgers.`);

        // 2. Clean Transactions
        const allTransactions = await db.collection('transactions').find({}, { projection: { _id: 1, userId: 1 } }).toArray();
        const orphanTxIds = allTransactions
            .filter(doc => doc.userId && !validUserIds.has(doc.userId.toString()))
            .map(doc => doc._id);
        let deletedTx = 0;
        if (orphanTxIds.length > 0) {
            const r = await db.collection('transactions').deleteMany({ _id: { $in: orphanTxIds } });
            deletedTx = r.deletedCount;
        }
        console.log(`Deleted ${deletedTx} orphan records from Transactions.`);

        // 3. Count Remaining
        const finalMint = await db.collection('transactionledgers').aggregate([
            { $match: { type: { $in: ['mint', 'admin_adjustment'] }, amount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).toArray();
        const finalLiability = await db.collection('users').aggregate([
            { $group: { _id: null, total: { $sum: '$wallet.main' } } }
        ]).toArray();

        console.log('=== POST-CLEANUP SUMMARY ===');
        console.log(`Total Minted (active users only): ${finalMint[0]?.total || 0} NXS`);
        console.log(`Total Liability (user wallets): ${finalLiability[0]?.total || 0} NXS`);
        console.log('Cleanup DONE!');

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

cleanOrphans();
