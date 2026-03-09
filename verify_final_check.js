const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        // Use mongo shell to find all users
        const res = await ssh.execCommand('mongo man2man --eval "db.users.find({}, {username: 1, role: 1}).toArray()" --quiet');
        console.log('--- DB CHECK ---');
        console.log(res.stdout);
        console.log('--- END DB CHECK ---');
    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
