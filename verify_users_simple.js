const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        const listRes = await ssh.execCommand('mongo man2man --eval "db.users.find({}, {username: 1, role: 1}).toArray()" --quiet');
        console.log('--- USER LIST ---');
        console.log(listRes.stdout.trim());
        console.log('--- END LIST ---');
    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
