const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditUniversal() {
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
        // Connect to universal_game_core_v1
        await mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1');
        
        const usersCount = await mongoose.connection.db.collection('users').countDocuments();
        const txsCount = await mongoose.connection.db.collection('transactions').countDocuments();
        
        console.log('---STATS_START---');
        console.log('USERS:', usersCount);
        console.log('TXS:', txsCount);
        console.log('---STATS_END---');
        
        if (usersCount > 0) {
            const sampleUser = await mongoose.connection.db.collection('users').findOne({});
            console.log('SAMPLE_USER (Universal):', JSON.stringify({
                _id: sampleUser._id,
                username: sampleUser.username,
                fullName: sampleUser.fullName,
                referralCode: sampleUser.referralCode,
                referredBy: sampleUser.referredBy
            }, null, 2));
        }

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/audit_universal.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node audit_universal.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

auditUniversal();
