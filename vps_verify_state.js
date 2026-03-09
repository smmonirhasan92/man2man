const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verifyVPS() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    const r = await ssh.execCommand(`node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man';
mongoose.connect(uri).then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    const txns = await db.collection('transactions').countDocuments();
    const lots = await db.collection('lotteryslots').countDocuments();
    const p2p  = await db.collection('p2porders').countDocuments();
    console.log('=== VPS DB STATE ===');
    console.log('Total Users:', users.length);
    users.forEach(u => console.log(' -', u.role, '|', u.phone || u.email, '| wallet.main:', u.wallet?.main));
    console.log('Transactions:', txns, '| Lotteries:', lots, '| P2P:', p2p);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"`, { cwd: '/var/www/man2man/backend' });

    console.log(r.stdout || r.stderr);
    ssh.dispose();
}

verifyVPS().catch(console.error);
