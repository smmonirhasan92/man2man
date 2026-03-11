const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function traceUser() {
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
        
        // 1. Find all users with referredBy to build a map
        const allUsers = await User.find({}).select('username fullName referralCode referredBy referralIncome referralEarningsByLevel');
        
        // Find users who have descendants
        const potentialKms = [];
        for (const u of allUsers) {
            const level1 = allUsers.filter(x => x.referredBy === u.referralCode);
            if (level1.length > 0) {
                const level2 = allUsers.filter(x => level1.map(l => l.referralCode).includes(x.referredBy));
                if (level1.length === 1 && level2.length === 2) {
                    potentialKms.push({
                        username: u.username,
                        fullName: u.fullName,
                        l1: level1.length,
                        l2: level2.length
                    });
                }
            }
        }

        console.log('--- POTENTIAL KM USERS (Match 1 L1, 2 L2) ---');
        console.log(JSON.stringify(potentialKms, null, 2));

        // 2. Check if KM initials match any user
        const kmInitials = allUsers.filter(u => u.fullName && (u.fullName.startsWith('K') || u.fullName.split(' ').map(n => n[0]).join('') === 'KM'));
        console.log('--- KM INITIAL MATCHES ---');
        console.log(JSON.stringify(kmInitials.map(u => ({ username: u.username, fullName: u.fullName })), null, 2));

        // 3. Check transaction types actually present in DB
        const types = await Transaction.distinct('type');
        console.log('--- TRANSACTION TYPES IN DB ---');
        console.log(types);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;

        await ssh.execCommand("cat << 'EOF' > /var/www/man2man/backend/trace_km.js\n" + diagScript + "\nEOF");
        const result = await ssh.execCommand('node trace_km.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

traceUser();
