const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REMOTE_BASE = '/var/www/man2man';
const SSH_CMD = 'ssh -o StrictHostKeyChecking=no root@76.13.244.202';

const filesToUpload = [
    { local: 'frontend/app/admin/history/page.js', remote: `${REMOTE_BASE}/frontend/app/admin/history/page.js` },
    { local: 'frontend/app/admin/layout.js', remote: `${REMOTE_BASE}/frontend/app/admin/layout.js` },
    { local: 'frontend/app/wallet/withdraw/page.js', remote: `${REMOTE_BASE}/frontend/app/wallet/withdraw/page.js` },
    { local: 'frontend/components/wallet/WithdrawForm.js', remote: `${REMOTE_BASE}/frontend/components/wallet/WithdrawForm.js` },
    { local: 'frontend/components/p2p/P2PDashboard.js', remote: `${REMOTE_BASE}/frontend/components/p2p/P2PDashboard.js` },
    { local: 'backend/modules/wallet/withdrawal.controller.js', remote: `${REMOTE_BASE}/backend/modules/wallet/withdrawal.controller.js` },
    { local: 'backend/modules/wallet/transaction.controller.js', remote: `${REMOTE_BASE}/backend/modules/wallet/transaction.controller.js` },
];

async function deploy() {
    console.log('--- SSH Connection Established ---');
    
    for (const file of filesToUpload) {
        console.log(`Uploading: ${path.basename(file.local)}`);
        execSync(`scp -o StrictHostKeyChecking=no "${file.local}" root@76.13.244.202:"${file.remote}"`);
    }

    console.log('--- Restarting Backend ---');
    execSync(`${SSH_CMD} "docker restart man2man-backend"`);

    console.log('--- Starting Frontend Rebuild ---');
    // Note: Rebuild is necessary for frontend changes
    const buildCmd = `${SSH_CMD} "cd ${REMOTE_BASE} && docker compose build frontend && docker compose up -d frontend"`;
    console.log('Running frontend rebuild (this may take a minute)...');
    execSync(buildCmd);

    console.log('--- Deployment Complete ---');
}

deploy().catch(err => {
    console.error('Deployment Failed:', err.message);
});
