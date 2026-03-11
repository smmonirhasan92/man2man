const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findKm() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS');

        const findScript = `
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
        
        // Search for users with referralCount 3 or matching initials
        const users = await User.find({ 
            $or: [
                { fullName: /^K.*M/i },
                { fullName: /^M.*K/i },
                { referralCount: 3 }
            ]
        });
        
        console.log('--- POTENTIAL USERS ---');
        console.log(JSON.stringify(users.map(u => ({
            id: u._id,
            username: u.username,
            fullName: u.fullName,
            referralCount: u.referralCount,
            referralIncome: u.referralIncome,
            referralEarningsByLevel: u.referralEarningsByLevel
        })), null, 2));

        // Let's also find who has the most referral commissions today
        const today = new Date();
        today.setHours(0,0,0,0);
        const topComms = await Transaction.aggregate([
            { $match: { type: 'referral_commission', status: 'completed' } },
            { $group: { _id: '$userId', count: { $sum: 1 }, total: { $sum: '$amount' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        console.log('--- TOP COMMISSION RECIPIENTS ---');
        for (const entry of topComms) {
            const user = await User.findById(entry._id);
            console.log(JSON.stringify({
                name: user ? user.fullName : 'Unknown',
                username: user ? user.username : 'Unknown',
                commCount: entry.count,
                commTotal: entry.total,
                userReferralIncome: user ? user.referralIncome : 0
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

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/find_km.js\n" + findScript + "\nEOF");

        const result = await ssh.execCommand('node find_km.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

findKm();
