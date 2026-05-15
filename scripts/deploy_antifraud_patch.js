const { execSync } = require('child_process');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: require('path').resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

// ─── PATCH 1: WalletService.js — Device-based Loan Block ──────────
const loanPatch = `
const fs = require('fs');
const filePath = '/var/www/man2man/backend/modules/wallet/WalletService.js';
let code = fs.readFileSync(filePath, 'utf8');

const oldBlock = \`            // 1. Check if user already has an active loan
            if (user.is_loan_active || (user.wallet && user.wallet.loan_due > 0)) {
                throw new Error('You already have an active loan. Please repay it before requesting a new one.');
            }\`;

const newBlock = \`            // 1. Check if user already has an active loan
            if (user.is_loan_active || (user.wallet && user.wallet.loan_due > 0)) {
                throw new Error('আপনার একটি সক্রিয় লোন রয়েছে। নতুন লোন নেওয়ার আগে পরিশোধ করুন।');
            }

            // [ANTI-FRAUD] Device-based loan block — same device cannot take multiple loans
            // even via different email accounts (10+ mails on same phone attack)
            if (user.deviceId) {
                const deviceLoanCount = await User.countDocuments({
                    deviceId: user.deviceId,
                    _id: { \\\$ne: user._id },
                    is_loan_active: true
                }).session(session);

                if (deviceLoanCount > 0) {
                    // Log this fraud attempt
                    console.warn('[ANTI-FRAUD] Device loan abuse blocked. DeviceId:', user.deviceId, 'UserId:', user._id);
                    throw new Error('এই ডিভাইস থেকে একটি লোন ইতিমধ্যে সক্রিয় আছে। একই ডিভাইসে একাধিক লোন গ্রহণ নিষিদ্ধ।');
                }

                // Also block if same device has taken MORE than 2 loans historically (paid or not)
                const deviceLifetimeLoanCount = await Transaction.countDocuments({
                    userId: { \\\$in: await User.find({ deviceId: user.deviceId, _id: { \\\$ne: user._id } }).distinct('_id') },
                    type: 'add_money',
                    'metadata.is_loan': true,
                    status: 'completed'
                }).session(session);

                if (deviceLifetimeLoanCount >= 2) {
                    console.warn('[ANTI-FRAUD] Device lifetime loan limit reached. DeviceId:', user.deviceId);
                    throw new Error('এই ডিভাইস থেকে লোনের সীমা অতিক্রান্ত হয়েছে।');
                }
            }

            // [ANTI-FRAUD] Require minimum account age (3 days) before loan is allowed
            const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
            const MIN_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
            if (accountAgeMs < MIN_AGE_MS) {
                throw new Error('নতুন অ্যাকাউন্টে লোন পাওয়া যায় না। কমপক্ষে ৩ দিন পর আবেদন করুন।');
            }\`;

if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync(filePath, code);
    console.log('✅ WalletService.js — Loan fraud patch applied.');
} else {
    console.log('⚠️  WalletService.js — Pattern not found, checking partial match...');
    if (code.includes('Check if user already has an active loan')) {
        console.log('  File has loan check but different format. Manual inspection needed.');
    }
}
`;

// ─── PATCH 2: auth.controller.js — Device-limit on Registration ──
const authPatch = `
const fs = require('fs');
const filePath = '/var/www/man2man/backend/modules/auth/auth.controller.js';
let code = fs.readFileSync(filePath, 'utf8');

// Add device limit check before registration completes
const oldRegBlock = \`                deviceId: req.body.deviceId || null,
                lastIp: req.ip || '0.0.0.0',\`;

const newRegBlock = \`                deviceId: req.body.deviceId || null,
                lastIp: req.ip || '0.0.0.0',\`;

// We need to add a pre-check BEFORE user creation in the registration flow.
// Find the device check insertion point
const insertAfter = \`            // [ANTI-FRAUD] Device Registration Limit — max 3 accounts per device\`;

if (!code.includes('[ANTI-FRAUD] Device Registration Limit')) {
    // Find a safe insertion point: before user creation
    const anchorString = 'deviceId: req.body.deviceId || null,';
    const anchorIndex = code.indexOf(anchorString);
    if (anchorIndex === -1) {
        console.log('⚠️ Auth anchor not found');
    } else {
        // Find start of the enclosing block to insert BEFORE it
        const insertPoint = code.lastIndexOf('const myReferralCode', anchorIndex);
        if (insertPoint !== -1) {
            const deviceGuard = \`
            // [ANTI-FRAUD] Device Registration Limit — max 3 accounts per device
            // Blocks multi-email abuse from same phone
            const incomingDeviceId = req.body.deviceId;
            if (incomingDeviceId) {
                const deviceAccountCount = await User.countDocuments({ deviceId: incomingDeviceId });
                if (deviceAccountCount >= 3) {
                    return res.status(429).json({ 
                        message: 'এই ডিভাইস থেকে সর্বোচ্চ ৩টি অ্যাকাউন্ট তৈরি করা যায়। নতুন অ্যাকাউন্টের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।'
                    });
                }
            }

\`;
            code = code.slice(0, insertPoint) + deviceGuard + code.slice(insertPoint);
            fs.writeFileSync(filePath, code);
            console.log('✅ auth.controller.js — Device registration limit patch applied.');
        } else {
            console.log('⚠️ Auth insertion point (myReferralCode) not found.');
        }
    }
} else {
    console.log('ℹ️  Auth device limit already patched.');
}
`;

try {
    console.log('=== Applying Anti-Fraud Patches ===\n');
    
    // Apply Loan Fraud Patch
    const b64_loan = Buffer.from(loanPatch).toString('base64');
    SSH(`printf '%s' '${b64_loan}' | base64 -d > /tmp/patch_loan.js`);
    console.log(SSH('node /tmp/patch_loan.js'));
    
    // Apply Auth Registration Patch
    const b64_auth = Buffer.from(authPatch).toString('base64');
    SSH(`printf '%s' '${b64_auth}' | base64 -d > /tmp/patch_auth.js`);
    console.log(SSH('node /tmp/patch_auth.js'));
    
    // Restart backend
    console.log('\nRestarting backend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
    console.log('✅ Backend restarted. Anti-fraud policies are now LIVE!');
    
} catch (e) {
    console.error('Error:', e.message);
}
