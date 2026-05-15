const { execSync } = require('child_process');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

const script = `
const fs = require('fs');
const file = '/var/www/man2man/backend/modules/p2p/P2PService.js';
let c = fs.readFileSync(file, 'utf8');

const oldBlock = \`        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // If they are selling NXS, they must have NXS balance\`;

const newBlock = \`        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // [SMART AD CONTROL] Check if user already has an OPEN ad for the same payment method and type
        const existingAd = await P2POrder.findOne({
            userId,
            type,
            paymentMethod,
            status: 'OPEN'
        });

        if (existingAd) {
            throw new Error('মার্কেটপ্লেস পলিসি: আপনার ইতিমধ্যে ' + paymentMethod + ' এর জন্য একটি এক্টিভ ' + type + ' অ্যাড রয়েছে। নতুন রেটে অ্যাড দিতে চাইলে পূর্বের অ্যাডটি ক্যানসেল করুন।');
        }

        // [FRESH TRANSACTION CHECK] Prevent creating ads if there are unresolved disputes
        const activeTrades = await P2PTrade.countDocuments({
            $or: [{ buyerId: userId }, { sellerId: userId }],
            status: { $in: ['DISPUTE', 'AWAITING_ADMIN'] }
        });

        if (activeTrades > 0) {
            throw new Error("আপনার অ্যাকাউন্টে পেন্ডিং বা ডিসপিউট থাকা অবস্থায় আপনি নতুন কোনো অ্যাড পোস্ট করতে পারবেন না।");
        }

        // If they are selling NXS, they must have NXS balance\`;

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
    fs.writeFileSync(file, c);
    console.log('Patch Applied Successfully');
} else {
    console.log('Patch not applied, block not found');
}
`;

const b64 = Buffer.from(script).toString('base64');
SSH(`echo '${b64}' | base64 -d > /tmp/patch_p2p.js`);
console.log(SSH(`node /tmp/patch_p2p.js`));
console.log('Restarting backend...');
SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
console.log('Deployment Complete.');
