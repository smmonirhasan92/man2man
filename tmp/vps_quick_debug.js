const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function debugVps() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS');

        const query = `
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const users = await User.find({ referralCount: { $gt: 0 } }).select('username fullName referralCount referralEarningsByLevel referralIncome');
    console.log('--- RECENT USERS WITH REFERRALS ---');
    console.log(JSON.stringify(users, null, 2));

    const latestComms = await Transaction.find({ type: 'referral_commission' }).sort({ createdAt: -1 }).limit(5);
    console.log('--- LATEST COMMISSIONS ---');
    console.log(JSON.stringify(latestComms, null, 2));

    process.exit(0);
});
`;
        // Write to file using scp-like method or just a safer echo
        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/quick_debug.js\n" + query + "\nEOF");

        const result = await ssh.execCommand('node quick_debug.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

debugVps();
