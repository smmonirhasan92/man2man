const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function listAllUsers() {
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
const User = require('./modules/user/UserModel');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
        const users = await User.find({}).select('username fullName referralCode referredBy referralIncome referralEarningsByLevel').limit(100);
        console.log('--- USERS START ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('--- USERS END ---');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/list_all_diag.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node list_all_diag.js', { cwd: '/var/www/man2man/backend' });
        process.stdout.write(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

listAllUsers();
