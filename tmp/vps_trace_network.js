const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function traceUserByNetwork() {
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
const Transaction = require('./modules/wallet/TransactionModel');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
        
        const allUsers = await User.find({}).select('username fullName referralCode referredBy referralIncome referralEarningsByLevel');
        
        const matches = [];
        for (const u of allUsers) {
            const l1 = allUsers.filter(x => x.referredBy === u.referralCode);
            const l1Codes = l1.map(x => x.referralCode);
            const l2 = allUsers.filter(x => l1Codes.includes(x.referredBy));
            
            if (l1.length === 1 && l2.length === 2) {
                matches.push({
                    username: u.username,
                    fullName: u.fullName,
                    l1: l1.length,
                    l2: l2.length,
                    inc: u.referralIncome,
                    lvls: u.referralEarningsByLevel
                });
            }
        }

        console.log('---MATCHES_START---');
        console.log(JSON.stringify(matches, null, 2));
        console.log('---MATCHES_END---');

        const types = await Transaction.distinct('type');
        console.log('---TYPES_START---');
        console.log(JSON.stringify(types, null, 2));
        console.log('---TYPES_END---');

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/trace_network.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node trace_network.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

traceUserByNetwork();
