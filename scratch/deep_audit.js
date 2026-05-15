const { MongoClient } = require('mongodb');

async function deepAudit() {
    const uri = 'mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0';
    const client = new MongoClient(uri, { directConnection: true });

    try {
        await client.connect();
        const db = client.db('universal_game_core_v1');

        // Get admin user
        const adminUser = await db.collection('users').findOne({ role: { $in: ['super_admin', 'admin'] } });
        console.log(`Admin User: ${adminUser?.username} (${adminUser?._id})`);

        // All mint/admin_adjustment records grouped by userId
        const mintsByUser = await db.collection('transactionledgers').aggregate([
            { $match: { type: { $in: ['mint', 'admin_adjustment'] }, amount: { $gt: 0 } } },
            { $group: { _id: '$userId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]).toArray();

        console.log('\n=== MINT BREAKDOWN PER USER ===');
        let adminOwnMints = 0;
        let userDeposits = 0;

        for (let entry of mintsByUser) {
            const user = await db.collection('users').findOne({ _id: entry._id });
            const role = user?.role || 'UNKNOWN';
            const name = user?.username || entry._id?.toString();

            if (role === 'super_admin' || role === 'admin') {
                adminOwnMints += entry.total;
                console.log(`[ADMIN SELF-MINT] ${name} (${role}): ${entry.total} NXS (${entry.count} records)`);
            } else {
                userDeposits += entry.total;
                console.log(`[USER DEPOSIT] ${name} (${role}): ${entry.total} NXS (${entry.count} records)`);
            }
        }

        console.log('\n=== FINAL BREAKDOWN ===');
        console.log(`Admin Self-Mints (owned by admin account): ${adminOwnMints} NXS`);
        console.log(`Actual User Deposits (given to users): ${userDeposits} NXS`);
        console.log(`Total: ${adminOwnMints + userDeposits} NXS`);
        console.log(`Current User Liability: Check dashboard`);

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

deepAudit();
