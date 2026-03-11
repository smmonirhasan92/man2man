const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function healUniversal() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS. Healing universal_game_core_v1...');

        const healerScript = `
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function sync() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('--- SYNC STARTED (Universal) ---');

        // Reset all users' referral stats
        await User.updateMany({}, { 
            $set: { 
                referralEarningsByLevel: [0, 0, 0, 0, 0],
                referralIncome: 0 
            } 
        });
        console.log('Reset counters.');

        // Fetch all referral transactions
        // We check for 'referral_commission' and 'commission' and 'referral_bonus'
        const comms = await Transaction.find({ 
            type: { $in: ['referral_commission', 'referral_bonus'] }, 
            status: 'completed' 
        });
        console.log('Syncing ' + comms.length + ' transactions.');

        for (const comm of comms) {
            let level = 1;
            if (comm.metadata && comm.metadata.level) {
                level = parseInt(comm.metadata.level);
            } else if (comm.description) {
                const match = comm.description.match(/L(\\d+)/i);
                if (match) level = parseInt(match[1]);
            }
            
            const index = level - 1;
            if (index >= 0 && index < 5) {
                await User.findByIdAndUpdate(comm.userId, {
                    $inc: {
                        ['referralEarningsByLevel.' + index]: comm.amount,
                        referralIncome: comm.amount
                    }
                });
            }
        }

        // Verify KM user
        const allUsers = await User.find({}).select('username fullName referralCode referredBy referralIncome referralEarningsByLevel');
        
        // Find user who matches l1:1, l2:2
        const matches = [];
        for (const u of allUsers) {
            const l1 = allUsers.filter(x => x.referredBy === u.referralCode);
            const l1Codes = l1.map(x => x.referralCode);
            const l2 = allUsers.filter(x => l1Codes.includes(x.referredBy));
            
            if (l1.length === 1 && l2.length === 2 && l1.length + l2.length === 3) {
                 matches.push({
                    username: u.username,
                    fullName: u.fullName,
                    earnings: u.referralEarningsByLevel,
                    total: u.referralIncome
                });
            }
        }

        console.log('--- TARGET MATCHES RECOVERED ---');
        console.log(JSON.stringify(matches, null, 2));
        console.log('--- SYNC COMPLETED ---');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
sync();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/heal_universal.js\n" + healerScript + "\nEOF");
        const result = await ssh.execCommand('node heal_universal.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

healUniversal();
