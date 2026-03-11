const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function listDbs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS');

        const diagScript = `
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/admin');
        const admin = mongoose.connection.useDb('admin');
        const dbs = await admin.db.admin().listDatabases();
        console.log('---DATABASES_START---');
        console.log(JSON.stringify(dbs, null, 2));
        console.log('---DATABASES_END---');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/list_dbs.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node list_dbs.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

listDbs();
