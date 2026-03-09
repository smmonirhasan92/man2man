const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function listCols() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        const res = await ssh.execCommand('mongosh universal_game_core_v1 --quiet --eval "db.getCollectionNames().join(\'\\n\')"');
        console.log("Collections:\n" + res.stdout);
    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
listCols();
