const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log('--- MONGO PROCESS ---');
        const ps = await ssh.execCommand('ps aux | grep mongo');
        console.log(ps.stdout);

        console.log('--- MONGOSH TEST ---');
        const dbs = await ssh.execCommand('mongosh --eval "db.getMongo().getDBNames()" --quiet');
        console.log('Databases:', dbs.stdout.trim());

        console.log('\n--- COLLECTION CHECK (man2man) ---');
        const colls = await ssh.execCommand('mongosh man2man --eval "db.getCollectionNames()" --quiet');
        console.log('Collections:', colls.stdout.trim());

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
