const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runHealer() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('✅ Connected to VPS. Running Referral Healer...');

        const healerScript = `
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

async function sync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- SYNC STARTED ---');

        // Reset all users' referral stats to zero first to avoid double counting during re-sync
        await User.updateMany({}, { 
            $set: { 
                referralEarningsByLevel: [0, 0, 0, 0, 0],
                referralIncome: 0 
            } 
        });
        console.log('Reset all referral counters.');

        // Fetch all referral_commission transactions
        const commissions = await Transaction.find({ type: 'referral_commission', status: 'completed' });
        console.log('Found ' + commissions.length + ' commissions to sync.');

        for (const comm of commissions) {
            const level = comm.metadata?.level || 1; // Default to 1 if missing
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

        console.log('--- SYNC COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (e) {
        console.error('SYNC ERROR:', e);
        process.exit(1);
    }
}
sync();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/referral_healer.js\n" + healerScript + "\nEOF");

        const result = await ssh.execCommand('node referral_healer.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        console.log(result.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

runHealer();
