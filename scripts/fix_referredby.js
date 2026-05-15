const { execSync } = require('child_process');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: require('path').resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

const patchScript = `
const fs = require('fs');
const filePath = '/var/www/man2man/frontend/components/admin/UserProfileModal.js';
let code = fs.readFileSync(filePath, 'utf8');

// FIX 1: referredBy.phone → primary_phone + fallback for string vs object
const oldReferredBy = \`                            {profile.referredBy && (
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-indigo-500/20">
                                    <Activity className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-indigo-400">Referred By</p>
                                        <p className="text-sm font-medium text-white mt-0.5">{profile.referredBy.fullName} ({profile.referredBy.phone})</p>
                                    </div>
                                </div>
                            )}\`;

const newReferredBy = \`                            {profile.referredBy ? (
                                <div className="flex items-center gap-4 bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30">
                                    <Activity className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-indigo-400">Referred By (Upline)</p>
                                        {typeof profile.referredBy === 'object' && profile.referredBy.fullName ? (
                                            <>
                                                <p className="text-sm font-bold text-white mt-0.5">{profile.referredBy.fullName}</p>
                                                <p className="text-xs text-indigo-300 font-mono">{profile.referredBy.primary_phone || profile.referredBy.phone || 'No phone'}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-medium text-white mt-0.5 font-mono">{String(profile.referredBy)}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-slate-700">
                                    <Activity className="w-5 h-5 text-slate-500 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Referred By</p>
                                        <p className="text-sm text-slate-400 mt-0.5">⚡ Direct Registration — No referrer</p>
                                    </div>
                                </div>
                            )}\`;

if (code.includes('profile.referredBy.phone')) {
    code = code.replace(oldReferredBy, newReferredBy);
    fs.writeFileSync(filePath, code);
    console.log('✅ UserProfileModal.js — referredBy display fixed.');
} else {
    console.log('⚠️  Pattern not found. Trying alternative match...');
    // Try a more targeted fix
    code = code.replace(
        \`{profile.referredBy.fullName} ({profile.referredBy.phone})\`,
        \`{typeof profile.referredBy === 'object' && profile.referredBy?.fullName 
            ? profile.referredBy.fullName + ' (' + (profile.referredBy.primary_phone || profile.referredBy.phone || 'N/A') + ')'
            : (profile.referredBy ? String(profile.referredBy) : 'Direct Registration')}\`
    );
    
    // Also fix the conditional to always show the block
    code = code.replace(
        '{profile.referredBy && (',
        '{('
    );
    
    fs.writeFileSync(filePath, code);
    console.log('✅ Applied targeted fix.');
}
`;

try {
    const b64 = Buffer.from(patchScript).toString('base64');
    SSH(`printf '%s' '${b64}' | base64 -d > /tmp/fix_referredby.js`);
    console.log(SSH('node /tmp/fix_referredby.js'));
    
    console.log('Rebuilding frontend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend`);
    console.log('✅ Done! Referrer name now shows correctly.');
} catch (e) {
    console.error('Error:', e.message);
}
