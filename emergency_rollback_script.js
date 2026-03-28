const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function emergencyRollback() {
    try {
        console.log('Connecting to VPS for EMERGENCY ROLLBACK...');
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

        // --- Phase 2: Directory Swap ---
        console.log('\n--- Phase 2: Directory Swap (Restoring Backup) ---');
        // Rename current failed version
        await ssh.execCommand('mv /var/www/man2man /var/www/man2man_failed_v3');
        // Restore previous working version
        await ssh.execCommand('mv /var/www/man2man_old /var/www/man2man');
        console.log('Success: Restored /var/www/man2man from backup.');

        // --- Phase 3: Fresh Start (Corrected CWD) ---
        console.log('\n--- Phase 3: Starting Services from Backup ---');
        // Use absolute CWD to ensure PM2 doesn't look in old inodes
        await ssh.execCommand('pm2 delete frontend || true');
        await ssh.execCommand('pm2 flush');
        const startCmd = 'pm2 start npm --name "frontend" --cwd /var/www/man2man/frontend -- start';
        console.log(`> Executing: ${startCmd}`);
        await ssh.execCommand(startCmd);
        await ssh.execCommand('pm2 restart man2man-backend || pm2 start index.js --name "man2man-backend" --cwd /var/www/man2man');

        // --- Phase 4: Final Verification (Curl) ---
        console.log('\n--- Phase 4: Verification (Curl) ---');
        console.log('Waiting 10s for Next.js to wake up...');
        await new Promise(r => setTimeout(r, 10000));
        
        const curlRes = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curlRes.stdout || 'Internal Curl failed! External check required.');

        console.log('\nEMERGENCY ROLLBACK completed. Site should be BACK to the previous version.');
        ssh.dispose();
    } catch (err) {
        console.error('Emergency Rollback Failed:', err);
        ssh.dispose();
    }
}
emergencyRollback();
