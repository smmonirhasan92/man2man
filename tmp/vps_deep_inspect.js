const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepDebug() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS');

        const queryScript = `
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Find user KM
        const u = await User.findOne({ fullName: /KM/i });
        if(!u) {
            console.log('--- USER KM NOT FOUND ---');
            // List all users with any referral income just in case
            const anyIncome = await User.find({ referralIncome: { $gt: 0 } }).limit(5);
            console.log('Users with income:', JSON.stringify(anyIncome.map(x => ({name: x.fullName, inc: x.referralIncome})), null, 2));
        } else {
            console.log('--- KM USER DATA ---');
            console.log(JSON.stringify({
                _id: u._id,
                username: u.username,
                fullName: u.fullName,
                referralIncome: u.referralIncome,
                referralEarningsByLevel: u.referralEarningsByLevel,
                wallet: u.wallet
            }, null, 2));

            const txCount = await Transaction.countDocuments({ userId: u._id, type: 'referral_commission' });
            console.log('Total referral commissions found:', txCount);

            const latestComms = await Transaction.find({ userId: u._id, type: 'referral_commission' }).sort({ createdAt: -1 }).limit(10);
            console.log('--- LATEST COMMISSIONS ---');
            console.log(JSON.stringify(latestComms.map(t => ({
                amount: t.amount,
                desc: t.description,
                meta: t.metadata,
                date: t.createdAt
            })), null, 2));
        }
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/deep_inspect.js\n" + queryScript + "\nEOF");

        const result = await ssh.execCommand('node deep_inspect.js', { cwd: '/var/www/man2man/backend' });
        console.log('--- STDOUT ---');
        console.log(result.stdout);
        console.log('--- STDERR ---');
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

deepDebug();
