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
        const dbInfo = await admin.db.admin().listDatabases();
        
        console.log('DB_LIST_START');
        dbInfo.databases.forEach(db => {
            console.log('DB_NAME:', db.name);
        });
        console.log('DB_LIST_END');
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/list_dbs_simple.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node list_dbs_simple.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

listDbs();
