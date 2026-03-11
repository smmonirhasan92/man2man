const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditDb() {
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
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const results = [];
        
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            results.push({ name: col.name, count: count });
            
            if (col.name === 'users') {
                const sample = await mongoose.connection.db.collection(col.name).findOne({});
                console.log('SAMPLE_USER:', JSON.stringify(sample, null, 2));
            }
        }

        console.log('---COLLECTIONS_START---');
        console.log(JSON.stringify(results, null, 2));
        console.log('---COLLECTIONS_END---');

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/audit_db.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node audit_db.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

auditDb();
