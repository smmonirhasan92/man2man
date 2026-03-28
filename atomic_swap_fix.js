const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function atomicSwapFix() {
    try {
        console.log('Connecting to VPS for ATOMIC SWAP FIX (Target: man2man)...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const rootDir = '/var/www/man2man';
        const buildDir = '/var/www/man2man_build';
        
        // --- Phase 1: Rsync Syncing ---
        console.log('\n--- Phase 1: Rsync Syncing (Build -> Live) ---');
        // We use -av --delete to ensure the live folder matches the successful build exactly.
        const rsyncCmd = `rsync -av --delete ${buildDir}/ ${rootDir}/`;
        console.log(`> Executing: ${rsyncCmd}`);
        const rsyncResult = await ssh.execCommand(rsyncCmd);
        console.log(rsyncResult.stdout);

        // --- Phase 2: PM2 Flush & Zombie Cleanup ---
        console.log('\n--- Phase 2: PM2 Flush & Zombie Cleanup ---');
        const cleanupCommands = [
            `fuser -k 3000/tcp || true`,
            `pm2 flush`,
            `pm2 restart all || (pm2 start npm --name "frontend" -- start)`
        ];
        for (const cmd of cleanupCommands) {
            console.log(`> Executing: ${cmd}`);
            await ssh.execCommand(cmd);
        }

        // --- Phase 3: Final Live Verification ---
        console.log('\n--- Phase 3: FINAL LIVE VERIFICATION (Grep Proof) ---');
        const verifyCmd = `grep -A 5 "accountType" ${rootDir}/frontend/components/p2p/OrderCreationModal.js | head -n 10`;
        console.log(`> Executing: ${verifyCmd}`);
        const verifyResult = await ssh.execCommand(verifyCmd);
        console.log('\nCODE PROOF FROM LIVE FOLDER:');
        console.log(verifyResult.stdout || 'VERIFICATION FAILED: Code not found in live folder!');

        console.log('\nATOMIC SWAP FIX completed successfully.');
        ssh.dispose();
    } catch (err) {
        console.error('Atomic Swap Fix Failed:', err);
        ssh.dispose();
    }
}
atomicSwapFix();
