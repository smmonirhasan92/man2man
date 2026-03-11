const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditReferrals() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS');

        const auditScript = `
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
        
        const user = await User.findOne({ fullName: /KM/i });
        if (!user) {
            console.log('USER_KM_NOT_FOUND');
        } else {
            console.log('--- USER INFO ---');
            console.log(JSON.stringify({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                referralCount: user.referralCount,
                referralIncome: user.referralIncome,
                referralEarningsByLevel: user.referralEarningsByLevel,
                wallet: user.wallet
            }, null, 2));

            const txs = await Transaction.find({ userId: user._id, type: 'referral_commission' }).sort({ createdAt: -1 });
            console.log('--- ALL REFERRAL COMMISSIONS (' + txs.length + ') ---');
            
            const summary = txs.map(t => ({
                amount: t.amount,
                desc: t.description,
                metaLevel: t.metadata?.level,
                date: t.createdAt
            }));
            console.log(JSON.stringify(summary, null, 2));
            
            // Check if there are any referral commissions at all in the DB
            const totalComms = await Transaction.countDocuments({ type: 'referral_commission' });
            console.log('--- TOTAL COMMISSIONS IN DB: ' + totalComms + ' ---');
        }
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/audit_vps.js\n" + auditScript + "\nEOF");

        const result = await ssh.execCommand('node audit_vps.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

auditReferrals();
