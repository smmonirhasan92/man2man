const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function atomicSwapFixV2() {
    try {
        console.log('Connecting to VPS for FINAL ATOMIC SWAP FIX (Target: man2man)...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const rootDir = '/var/www/man2man';
        const buildDir = '/var/www/man2man_build';
        
        // --- Phase 1: Rsync Syncing with --delete ---
        console.log('\n--- Phase 1: Rsync Syncing (Build -> Live) ---');
        // --delete ensures any old files in Live that are not in Build are removed.
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

        // --- Phase 3: FINAL LIVE VERIFICATION (Grep Proof) ---
        console.log('\n--- Phase 3: FINAL LIVE VERIFICATION (Grep Proof) ---');
        const verifyCmd = `grep -A 5 "accountType" ${rootDir}/frontend/components/p2p/OrderCreationModal.js | head -n 10`;
        console.log(`> Executing: ${verifyCmd}`);
        const verifyResult = await ssh.execCommand(verifyCmd);
        console.log('\nDEEP PROOF FROM LIVE FOLDER (/var/www/man2man):');
        console.log(verifyResult.stdout || 'CRITICAL FAILURE: Code not found in live folder even after rsync!');

        ssh.dispose();
    } catch (err) {
        console.error('Final Atomic Swap Fix Failed:', err);
        ssh.dispose();
    }
}
atomicSwapFixV2();
