const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const collections = [
            'users',
            'transactions',
            'lotteryslots',
            'userplans',
            'gamelogs',
            'p2porders',
            'supportmessages'
        ];

        console.log('--- FINAL DATA AUDIT (man2man) ---');
        for (const col of collections) {
            const res = await ssh.execCommand(`mongosh man2man --eval "db.${col}.countDocuments()" --quiet`);
            console.log(`${col.padEnd(20)}: ${res.stdout.trim()}`);
        }

        const superAdminCheck = await ssh.execCommand('mongosh man2man --eval "db.users.find({role:\'super_admin\'}).count()" --quiet');
        console.log('\nSuper Admin Count:', superAdminCheck.stdout.trim());

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
