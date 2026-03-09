const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log('--- DB NAMES ---');
        const dbs = await ssh.execCommand('mongo --eval "db.getMongo().getDBNames()" --quiet');
        console.log(dbs.stdout.trim());

        console.log('\n--- USERS IN man2man ---');
        const users = await ssh.execCommand('mongo man2man --eval "db.users.find({}, {username: 1, role: 1}).toArray()" --quiet');
        console.log(users.stdout.trim());

        console.log('\n--- SYSTEM INFO ---');
        const uptime = await ssh.execCommand('uptime');
        console.log(uptime.stdout.trim());

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
