const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkVpsDb() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    // Check what MONGODB_URI the app actually uses
    const env = await ssh.execCommand('cat /var/www/man2man/backend/.env | grep -i mongo');
    console.log('=== .env MONGODB settings ===');
    console.log(env.stdout);

    // Check which DB has users
    const dbCheck = await ssh.execCommand(`node -e "
const mongoose = require('mongoose');
const dbs = ['man2man', 'universal_game_core_v1'];
async function check() {
    for (const db of dbs) {
        try {
            const conn = await mongoose.createConnection('mongodb://127.0.0.1:27017/' + db).asPromise();
            const count = await conn.db.collection('users').countDocuments();
            const walletSum = await conn.db.collection('users').aggregate([{ \\$group: { _id: null, total: { \\$sum: '\\$wallet.main' } } }]).toArray();
            console.log(db + ': ' + count + ' users, wallet_main_sum=' + (walletSum[0]?.total || 0));
            await conn.close();
        } catch(e) { console.log(db + ': ERROR -', e.message); }
    }
    process.exit(0);
}
check();
"`, { cwd: '/var/www/man2man/backend' });
    console.log('\n=== DB User Counts ===');
    console.log(dbCheck.stdout);
    if (dbCheck.stderr) console.log(dbCheck.stderr.substring(0, 300));

    ssh.dispose();
}
checkVpsDb().catch(console.error);
