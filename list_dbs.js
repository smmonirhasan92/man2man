const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function listDBs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        const res = await ssh.execCommand('mongosh --quiet --eval "db.adminCommand(\'listDatabases\').databases.map(d => d.name).join(\'\\n\')"');
        console.log("Databases:\n" + res.stdout);
    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
listDBs();
