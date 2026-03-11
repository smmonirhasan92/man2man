const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditVps() {
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
        
        const results = {};

        // 1. Transaction Types
        results.transactionTypes = await Transaction.distinct('type');

        // 2. Users with referral info
        const allUsers = await User.find({}).select('username fullName referralCode referredBy referralIncome referralEarningsByLevel');
        results.referralStats = allUsers.map(u => {
            const l1 = allUsers.filter(x => x.referredBy === u.referralCode).length;
            return {
                usernm: u.username,
                name: u.fullName,
                refCode: u.referralCode,
                refBy: u.referredBy,
                l1: l1,
                inc: u.referralIncome,
                lvlInc: u.referralEarningsByLevel
            };
        }).filter(u => u.l1 > 0 || u.inc > 0);

        // 3. Find KM
        results.kmCandidates = allUsers.filter(u => {
            if (!u.fullName) return false;
            const initials = u.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
            return initials.includes('KM') || u.fullName.toUpperCase().includes('KM');
        }).map(u => ({ usernm: u.username, name: u.fullName }));

        console.log('---BEGIN_JSON---');
        console.log(JSON.stringify(results, null, 2));
        console.log('---END_JSON---');

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/audit_diag.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node audit_diag.js', { cwd: '/var/www/man2man/backend' });

        const output = result.stdout;
        const jsonMatch = output.match(/---BEGIN_JSON---([\s\S]*?)---END_JSON---/);
        if (jsonMatch) {
            console.log(jsonMatch[1]);
        } else {
            console.log('JSON not found in output');
            console.log(output);
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

auditVps();
