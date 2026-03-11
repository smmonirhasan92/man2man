const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixVps() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS');

        const fixScript = `
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/man2man');
        
        // 1. Reset ALL referral data for a clean sync
        await User.updateMany({}, { 
            $set: { 
                referralEarningsByLevel: [0, 0, 0, 0, 0],
                referralIncome: 0 
            } 
        });
        console.log('Resetted all users.');

        // 2. Fetch all completed referral commissions
        const comms = await Transaction.find({ type: 'referral_commission', status: 'completed' });
        console.log('Syncing ' + comms.length + ' transactions...');

        for (const c of comms) {
            let level = 1;
            if (c.metadata && c.metadata.level) {
                level = c.metadata.level;
            } else if (c.description) {
                // Try to parse level from description: "L1 Commission...", "L2 Task Bonus..."
                const match = c.description.match(/L(\\d+)/);
                if (match) level = parseInt(match[1]);
            }

            const index = level - 1;
            if (index >= 0 && index < 5) {
                await User.findByIdAndUpdate(c.userId, {
                    $inc: {
                        ['referralEarningsByLevel.' + index]: c.amount,
                        referralIncome: c.amount
                    }
                });
            }
        }

        // 3. Find KM and log his final state
        const km = await User.findOne({ referralCount: 3 });
        if (km) {
            console.log('--- FINAL STATE FOR KM ---');
            console.log(JSON.stringify({
                username: km.username,
                fullName: km.fullName,
                earnings: km.referralEarningsByLevel,
                total: km.referralIncome
            }, null, 2));
        }

        console.log('SYNC_DONE');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/final_healer.js\n" + fixScript + "\nEOF");
        const result = await ssh.execCommand('node final_healer.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

fixVps();
