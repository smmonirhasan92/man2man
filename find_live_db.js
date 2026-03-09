const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const script = `
        db.getMongo().getDBNames().forEach(dbName => {
            const d = db.getSiblingDB(dbName);
            if (d.getCollectionNames().includes('users')) {
                const u = d.collection('users').findOne({ username: 'Shadin' });
                if (u) {
                    print('FOUND_IN_DB:' + dbName);
                }
            }
        });
        `;

        const res = await ssh.execCommand('mongosh --eval "' + script.replace(/"/g, '\\"').replace(/\n/g, ' ') + '" --quiet');
        console.log(res.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
