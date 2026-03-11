const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function listUsers() {
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
        const users = await User.find({ referralCount: { $gt: 0 } }).select('username fullName referralCount referralIncome referralEarningsByLevel');
        console.log('--- USER DATA START ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('--- USER DATA END ---');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/list_users_diag.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node list_users_diag.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

listUsers();
