const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function resetVPSUsers() {
    console.log('🔌 Connecting to VPS...');
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        console.log('✅ Connected.');

        // Step 1: Check current user count BEFORE reset
        console.log('\n--- BEFORE RESET: User Count ---');
        const before = await ssh.execCommand(`node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man').then(async () => {
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const superAdmins = users.filter(u => u.role === 'super_admin' || u.role === 'admin');
    console.log('Total users:', users.length);
    console.log('Super Admins to preserve:', superAdmins.map(u => u.phone || u.email));
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`, { cwd: '/var/www/man2man/backend' });
        console.log(before.stdout);
        if (before.stderr) console.log('STDERR:', before.stderr);

        // Step 2: Run the production reset script
        console.log('\n--- RUNNING PRODUCTION RESET ---');
        const reset = await ssh.execCommand(
            'node scripts/production_reset.js',
            { cwd: '/var/www/man2man/backend' }
        );
        console.log(reset.stdout);
        if (reset.stderr) console.log('STDERR:', reset.stderr);

        // Step 3: Verify AFTER reset
        console.log('\n--- AFTER RESET: Verification ---');
        const after = await ssh.execCommand(`node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').countDocuments();
    const superAdmins = await db.collection('users').find({ role: 'super_admin' }).toArray();
    const txns = await db.collection('transactions').countDocuments();
    const lotteries = await db.collection('lotteryslots').countDocuments();
    const p2p = await db.collection('p2porders').countDocuments();
    console.log('Remaining users:', users);
    console.log('Super admin(s):', superAdmins.map(u => u.phone || u.email));
    console.log('Transactions:', txns, '| Lotteries:', lotteries, '| P2P Orders:', p2p);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`, { cwd: '/var/www/man2man/backend' });
        console.log(after.stdout);
        if (after.stderr) console.log('STDERR:', after.stderr);

        ssh.dispose();
        console.log('\n✅ VPS Reset Complete!');
    } catch (err) {
        console.error('❌ SSH Error:', err.message);
        ssh.dispose();
    }
}

resetVPSUsers();
