const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        console.log('--- Checking MongoDB Service ---');
        const mongoStatus = await ssh.execCommand('systemctl status mongodb');
        console.log(mongoStatus.stdout.slice(0, 100));

        console.log('--- Checking User Count (Verbose) ---');
        // Try both mongo and mongosh
        const res1 = await ssh.execCommand('mongo man2man --eval "db.users.count()"');
        console.log('Mongo User Count:', res1.stdout.trim());

        const res2 = await ssh.execCommand('mongosh man2man --eval "db.users.count()" --quiet');
        console.log('Mongosh User Count:', res2.stdout.trim());

        console.log('--- Listing Collections ---');
        const colls = await ssh.execCommand('mongo man2man --eval "db.getCollectionNames()"');
        console.log('Collections:', colls.stdout.trim());

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        ssh.dispose();
    }
}

run();
