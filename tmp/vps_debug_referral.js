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

        // Create a temporary debug script on the VPS
        const remoteScript = `
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Find user with initials KM or matching the counts in screenshot
        const users = await User.find({ fullName: /KM/i });
        console.log('--- USER DATA ---');
        console.log(JSON.stringify(users.map(u => ({
            username: u.username,
            fullName: u.fullName,
            referralEarningsByLevel: u.referralEarningsByLevel,
            referralIncome: u.referralIncome,
            wallet: u.wallet
        })), null, 2));

        for(const u of users) {
            console.log('--- RECENT COMMISSIONS for ' + u.username + ' ---');
            const comms = await Transaction.find({ userId: u._id, type: 'referral_commission' }).sort({ createdAt: -1 }).limit(10);
            console.log(JSON.stringify(comms, null, 2));
        }

        mongoose.connection.close();
    } catch (e) { console.error(e); }
}
run();
`;

        await ssh.execCommand(`echo "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > /var/www/man2man/backend/debug_referral_live.js`);

        const result = await ssh.execCommand('node debug_referral_live.js', { cwd: '/var/www/man2man/backend' });
        console.log('--- VPS DEBUG OUTPUT ---');
        console.log(result.stdout);
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

debugVps();
