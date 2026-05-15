/**
 * VPS PATCH SCRIPT — apply_vps_patches.js
 * Applies all session changes directly to /var/www/man2man on VPS.
 * Run with: node scripts/apply_vps_patches.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SSH = (cmd) => {
    console.log(`\n[SSH] Running: ${cmd.substring(0, 80)}...`);
    try {
        const result = execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
            cwd: path.resolve(__dirname, '..'),
            encoding: 'utf8',
            timeout: 60000
        });
        console.log(result);
        return result;
    } catch (e) {
        console.error('[ERROR]', e.message);
        throw e;
    }
};

// Upload a file to VPS using base64 encoding (avoids all shell escaping issues)
function uploadFile(localPath, remotePath) {
    const content = fs.readFileSync(localPath, 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    console.log(`\n[UPLOAD] ${localPath} → ${remotePath}`);
    // Write in chunks to avoid argument length limits
    const chunkSize = 4000;
    // First, clear the file
    SSH(`echo '' > ${remotePath}`);
    // Then decode from base64 and write
    const cmd = `echo '${b64}' | base64 -d > ${remotePath}`;
    return SSH(cmd);
}

async function main() {
    console.log('=== MAN2MAN VPS PATCH RUNNER ===\n');

    // 1. Verify VPS connection
    SSH('echo VPS_CONNECTED && ls /var/www/man2man | head -5');

    // 2. Create backup of files we'll modify
    console.log('\n[STEP 1] Creating backups...');
    SSH('cd /var/www/man2man && ' +
        'cp backend/modules/lottery/LotteryService.js backend/modules/lottery/LotteryService.js.bak 2>/dev/null || true && ' +
        'cp backend/modules/wallet/transaction.controller.js backend/modules/wallet/transaction.controller.js.bak 2>/dev/null || true && ' +
        'cp frontend/app/admin/dashboard/page.js frontend/app/admin/dashboard/page.js.bak 2>/dev/null || true && ' +
        'cp frontend/app/admin/audit/page.js frontend/app/admin/audit/page.js.bak 2>/dev/null || true && ' +
        'echo Backups_created');

    // 3. Patch LotteryService.js — Replace findByIdAndUpdate with atomic findOneAndUpdate
    console.log('\n[STEP 2] Patching LotteryService.js...');
    SSH(`cd /var/www/man2man && node -e "
const fs = require('fs');
let c = fs.readFileSync('backend/modules/lottery/LotteryService.js', 'utf8');
const idx = c.indexOf('const user = await User.findById(userId).session(session)');
if (idx === -1) { console.log('Already patched or not found'); process.exit(0); }
const start = c.lastIndexOf('// 2. Deduct Funds', idx);
const end = c.indexOf('// 3. Log Transaction', idx);
const oldBlock = c.substring(start, end);
const newBlock = \`// 2. Deduct Funds (Atomic - Race Condition Safe)
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, 'wallet.main': { \\\\$gte: cost } },
                { \\\\$inc: { 'wallet.main': -cost } },
                { session, new: true }
            );
            if (!updatedUser) {
                const checkUser = await User.findById(userId).session(session);
                if (!checkUser) throw new Error('User not found');
                throw new Error('Insufficient Balance. Need ' + cost + ', Have ' + (checkUser.wallet.main || 0));
            }
            \`;
c = c.replace(oldBlock, newBlock);
fs.writeFileSync('backend/modules/lottery/LotteryService.js', c);
console.log('LotteryService patched OK');
"`);

    // 4. Patch transaction.controller.js — Replace findById+save with atomic findOneAndUpdate
    console.log('\n[STEP 3] Patching transaction.controller.js...');
    SSH(`cd /var/www/man2man && node -e "
const fs = require('fs');
let c = fs.readFileSync('backend/modules/wallet/transaction.controller.js', 'utf8');

// Patch 1: Deposit atomic update
c = c.replace(
    \\\`if (!user.wallet) user.wallet = { main: 0, game: 0, income: 0, purchase: 0 };
                    user.wallet.main = (user.wallet.main || 0) + amountToAdd;
                    await user.save({ session });\\\`,
    \\\`const dbUser = await User.findOneAndUpdate(
                        { _id: transaction.userId },
                        { \\\\$inc: { 'wallet.main': amountToAdd } },
                        { new: true, session }
                    );
                    user.wallet.main = dbUser.wallet.main;\\\`
);

// Patch 2: Withdrawal agent credit
c = c.replace(
    \\\`const agent = await User.findById(procAgentId).session(session);
                        if (agent) {
                            agent.wallet.main = (agent.wallet.main || 0) + Math.abs(parseFloat(transaction.amount));
                            await agent.save({ session });
                        }\\\`,
    \\\`await User.findOneAndUpdate(
                            { _id: procAgentId },
                            { \\\\$inc: { 'wallet.main': Math.abs(parseFloat(transaction.amount)) } },
                            { session }
                        );\\\`
);

fs.writeFileSync('backend/modules/wallet/transaction.controller.js', c);
console.log('transaction.controller patched OK');
"`);

    // 5. Upload currency.js
    console.log('\n[STEP 4] Uploading currency.js...');
    const currencyContent = Buffer.from(`// Currency Utility for NXS and USD — Standard: 1 USD = 100 NXS
export const NXS_RATIO = 100;
export const formatNXS = (amount, includeSymbol = true) => {
    const value = Number(amount || 0);
    const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return includeSymbol ? formatted + ' NXS' : formatted;
};
export const formatUSD = (amount, includeSymbol = true) => {
    const value = Number(amount || 0);
    const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return includeSymbol ? '$' + formatted : formatted;
};
export const nxsToUsd = (nxsAmount) => Number((Number(nxsAmount || 0) / NXS_RATIO).toFixed(2));
export const usdToNxs = (usdAmount) => Number((Number(usdAmount || 0) * NXS_RATIO).toFixed(2));
export const formatNxsToUsd = (nxsAmount) => formatUSD(nxsToUsd(nxsAmount));
`).toString('base64');
    SSH(`echo '${currencyContent}' | base64 -d > /var/www/man2man/frontend/utils/currency.js && echo currency.js_uploaded`);

    // 6. Verify files
    console.log('\n[STEP 5] Verification...');
    SSH('ls -la /var/www/man2man/frontend/utils/currency.js && grep -c "findOneAndUpdate" /var/www/man2man/backend/modules/lottery/LotteryService.js');

    // 7. Rebuild Docker containers
    console.log('\n[STEP 6] Rebuilding Docker containers...');
    SSH('cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend backend 2>&1 | tail -20');

    // 8. Final health check
    console.log('\n[STEP 7] Health check...');
    SSH('docker ps --format "table {{.Names}}\\t{{.Status}}"');

    console.log('\n=== ALL PATCHES APPLIED SUCCESSFULLY ===');
}

main().catch(err => {
    console.error('PATCH FAILED:', err.message);
    process.exit(1);
});
