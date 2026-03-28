const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function correctedRollback() {
    try {
        console.log('Connecting to VPS for CORRECTED EMERGENCY ROLLBACK...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        // --- Phase 1: Total Process Stop ---
        console.log('\n--- Phase 1: Total Process Stop ---');
        await ssh.execCommand('pm2 stop all');
        await ssh.execCommand('fuser -k 3000/tcp || true');

        // --- Phase 2: Corrected Directory Swap ---
        console.log('\n--- Phase 2: Corrected Directory Swap ---');
        // Currently 'man2man' (Mar 28) is the FAILED v3
        // Currently 'man2man_failed_v3' (Mar 25) is the WORKING BACKUP
        
        // 1. Rename failing version to its proper name
        await ssh.execCommand('mv /var/www/man2man /var/www/man2man_actually_failed_v3_atomic');
        
        // 2. Restore the TRUE backup (Mar 25) to live folder
        await ssh.execCommand('mv /var/www/man2man_failed_v3 /var/www/man2man');
        console.log('Success: Restored TRUE backup (Mar 25) to /var/www/man2man.');

        // --- Phase 3: Fresh Start (Absolute Path) ---
        console.log('\n--- Phase 3: Starting Services from TRUE Backup ---');
        await ssh.execCommand('pm2 delete frontend || true');
        await ssh.execCommand('pm2 flush');
        const startCmd = 'pm2 start npm --name "frontend" --cwd /var/www/man2man/frontend -- start';
        console.log(`> Executing: ${startCmd}`);
        await ssh.execCommand(startCmd);
        await ssh.execCommand('pm2 start index.js --name "man2man-backend" --cwd /var/www/man2man');

        // --- Phase 4: Final Verification (Curl) ---
        console.log('\n--- Phase 4: Final Verification (Internal Curl) ---');
        console.log('Waiting 10s for Next.js to wake up...');
        await new Promise(r => setTimeout(r, 10000));
        
        const curlRes = await ssh.execCommand('curl -I http://localhost:3000');
        console.log('\nRESULT FROM LIVE START:');
        console.log(curlRes.stdout || 'Internal Curl failed! External check required.');

        console.log('\nCORRECTED EMERGENCY ROLLBACK completed. Site should be BACK to the functional version.');
        ssh.dispose();
    } catch (err) {
        console.error('Corrected Emergency Rollback Failed:', err);
        ssh.dispose();
    }
}
correctedRollback();
