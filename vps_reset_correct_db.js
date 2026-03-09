const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

// Active DB confirmed: universal_game_core_v1
// man2man DB: was empty (1 super_admin only) - can be dropped

async function resetActiveDb() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
    console.log('✅ Connected to VPS\n');

    // Step 1: Reset users in universal_game_core_v1 (the ACTIVE DB)
    console.log('--- Resetting users in universal_game_core_v1 ---');
    const reset = await ssh.execCommand(`node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1').then(async () => {
    const db = mongoose.connection.db;

    // Find super admins to preserve
    const superAdmins = await db.collection('users').find({ role: 'super_admin' }).toArray();
    console.log('Preserving', superAdmins.length, 'super admin(s):', superAdmins.map(u => u.phone || u.email));
    const superAdminIds = superAdmins.map(u => u._id);

    // Delete all non-admin users
    const del = await db.collection('users').deleteMany({ _id: { \\$nin: superAdminIds } });
    console.log('Deleted', del.deletedCount, 'users');

    // Clear all transactional collections
    const cols = ['transactions', 'lotteryslots', 'userplans', 'notifications',
                  'p2porders', 'p2ptrades', 'p2pmessages', 'supportmessages',
                  'gamelogs', 'transactionledgers', 'taskads'];
    for (const col of cols) {
        const r = await db.collection(col).deleteMany({});
        if (r.deletedCount > 0) console.log('Cleared', col + ':', r.deletedCount);
    }

    // Reset super admin wallets
    await db.collection('users').updateMany(
        { role: 'super_admin' },
        { \\$set: { 'wallet.main': 0, 'wallet.income': 0, 'wallet.purchase': 0,
                   'wallet.commission': 0, 'wallet.escrow_locked': 0,
                   referralCount: 0, activePlanId: null } }
    );
    console.log('Super admin wallets reset to 0');

    process.exit(0);
}).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
"`, { cwd: '/var/www/man2man/backend' });
    console.log(reset.stdout);
    if (reset.stderr && reset.stderr.length > 0) console.log('STDERR:', reset.stderr.substring(0, 200));

    // Step 2: Drop unused man2man DB (it was empty & unused)
    console.log('\n--- Dropping unused man2man database ---');
    const drop = await ssh.execCommand(`node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/man2man').then(async () => {
    await mongoose.connection.db.dropDatabase();
    console.log('man2man DB dropped successfully.');
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`);
    console.log(drop.stdout);

    // Step 3: Final verification
    console.log('\n--- FINAL STATE ---');
    const verify = await ssh.execCommand(`node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    const txns = await db.collection('transactions').countDocuments();
    const plans = await db.collection('userplans').countDocuments();
    console.log('Total Users:', users.length);
    users.forEach(u => console.log(' -', u.role, '|', u.phone || u.email, '| wallets reset:', u.wallet?.main === 0));
    console.log('Transactions:', txns, '| UserPlans:', plans);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`, { cwd: '/var/www/man2man/backend' });
    console.log(verify.stdout);

    ssh.dispose();
    console.log('✅ Done!');
}

resetActiveDb().catch(console.error);
