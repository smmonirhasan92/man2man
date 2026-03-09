const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const dbs = ['man2man', 'l_game_core_v1'];
        for (const dbName of dbs) {
            console.log(`\n--- DB: ${dbName} ---`);
            const countRes = await ssh.execCommand(`mongosh ${dbName} --eval "db.users.countDocuments()" --quiet`);
            console.log('User Count:', countRes.stdout.trim());

            if (parseInt(countRes.stdout) > 0) {
                const listRes = await ssh.execCommand(`mongosh ${dbName} --eval "db.users.find({}, {username: 1, role: 1}).toArray()" --quiet`);
                console.log('Details:', listRes.stdout.trim());
            }
        }
    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
