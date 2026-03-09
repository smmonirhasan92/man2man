const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log('--- Checking universal_game_core_v1 ---');
        const count = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.users.countDocuments()" --quiet');
        console.log('Count:', count.stdout.trim());

        const list = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.users.find({}, {username: 1, role: 1}).limit(10).toArray()" --quiet');
        console.log('User List:', list.stdout.trim());

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
