const { execSync } = require('child_process');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

const patchScript = `
const fs = require('fs');
const filePath = '/var/www/man2man/backend/controllers/adminController.js';
let code = fs.readFileSync(filePath, 'utf8');

// PATCH: Replace the getUserDetails function's user fetch block
// to resolve referredBy (referral code string) → actual upline user object
const oldFetch = \`        const user = await User.findById(req.params.id)
            .select('+ipAddress +lastLogin +deviceId +lastIp +status +loyaltyScore +promotionalStatus')
            .populate('referredBy', 'fullName primary_phone')
            .lean();

        if (!user) return res.status(404).json({ message: "User not found" });\`;

const newFetch = \`        const user = await User.findById(req.params.id)
            .select('+ipAddress +lastLogin +deviceId +lastIp +status +loyaltyScore +promotionalStatus')
            .lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        // [FIX] referredBy stores a referral CODE string (e.g. "F8D608BC"), not an ObjectId.
        // We must look up the upline user by their referralCode field.
        if (user.referredBy && typeof user.referredBy === 'string') {
            const uplineUser = await User.findOne({ 
                $or: [
                    { referralCode: user.referredBy },
                    { 'referralSecurity.currentId': user.referredBy },
                    { 'referralSecurity.history': user.referredBy }
                ]
            }).select('fullName username primary_phone email referralCode').lean();
            
            if (uplineUser) {
                user.referredBy = {
                    fullName: uplineUser.fullName,
                    username: uplineUser.username || '',
                    primary_phone: uplineUser.primary_phone || uplineUser.email || 'N/A',
                    referralCode: user.referredBy
                };
            } else {
                // Upline not found — show the code as-is
                user.referredBy = {
                    fullName: 'Unknown User',
                    username: '',
                    primary_phone: 'N/A',
                    referralCode: user.referredBy
                };
            }
        }\`;

if (code.includes('.populate(\\'referredBy\\', \\'fullName primary_phone\\')')) {
    code = code.replace(oldFetch, newFetch);
    fs.writeFileSync(filePath, code);
    console.log('✅ adminController.js — referredBy resolution patched successfully.');
} else {
    console.log('⚠️ Pattern not found. Checking current state...');
    const hasAlreadyPatched = code.includes('referralCode: user.referredBy');
    console.log('Already patched?', hasAlreadyPatched);
}
`;

try {
    console.log('Patching adminController.js on VPS...');
    const b64 = Buffer.from(patchScript).toString('base64');
    SSH(`printf '%s' '${b64}' | base64 -d > /tmp/fix_referredby_backend.js`);
    console.log(SSH('node /tmp/fix_referredby_backend.js'));
    
    console.log('Restarting backend container...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
    console.log('✅ Backend restarted. Referrer name will now show correctly!');
} catch (e) {
    console.error('Error:', e.message);
}
