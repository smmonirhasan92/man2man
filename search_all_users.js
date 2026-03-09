const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const script = `
        const dbs = db.getMongo().getDBNames();
        dbs.forEach(dbName => {
            const currDb = db.getSiblingDB(dbName);
            const colls = currDb.getCollectionNames();
            if (colls.includes('users')) {
                const users = currDb.collection('users').find({}, { username: 1, role: 1 }).toArray();
                if (users.length > 0) {
                    print('--- DB: ' + dbName + ' ---');
                    users.forEach(u => print(' - ' + u.username + ' (' + u.role + ')'));
                }
            }
        });
        `;

        const res = await ssh.execCommand('mongosh --eval "' + script.replace(/"/g, '\\"').replace(/\n/g, ' ') + '" --quiet');
        console.log(res.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
