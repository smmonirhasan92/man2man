const mongoose = require('mongoose');

async function inspect() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB Connected:', mongoose.connection.db.databaseName);

    // 1. Sample users with tier info
    const users = await mongoose.connection.db.collection('users').find(
        {},
        { projection: { phone: 1, 'taskData.accountTier': 1, active_plans: 1 } }
    ).limit(5).toArray();

    console.log('\n=== SAMPLE USERS (with tier) ===');
    for (const u of users) {
        console.log({
            phone: u.phone,
            tier: u.taskData?.accountTier || 'NONE',
            activePlans: (u.active_plans || []).map(p => ({ name: p.planName, price: p.unlock_price }))
        });
    }

    // 2. VIP plans in DB
    const vipPlans = await mongoose.connection.db.collection('plans').find({ type: 'vip' }).toArray();
    console.log('\n=== VIP PLANS IN DB ===');
    for (const p of vipPlans) {
        console.log({ name: p.name, type: p.type, unlock_price: p.unlock_price });
    }

    // 3. Count users per tier
    const tierCounts = await mongoose.connection.db.collection('users').aggregate([
        { $group: { _id: '$taskData.accountTier', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\n=== TIER DISTRIBUTION ===');
    console.log(tierCounts);

    process.exit(0);
}

inspect().catch(e => { console.error(e); process.exit(1); });
