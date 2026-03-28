const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function emergencyRecoverManual() {
    try {
        console.log('Connecting to VPS for EMERGENCY MANUAL RECOVERY...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const liveDir = '/var/www/man2man/frontend';

        // --- Phase 1: Clean Up ---
        console.log('\n--- Phase 1: Total Process & Port Clean Up ---');
        await ssh.execCommand('pm2 stop all');
        await ssh.execCommand('fuser -k 3000/tcp || true');
        await ssh.execCommand('pm2 flush');

        // --- Phase 2: Manual Build ---
        console.log('\n--- Phase 2: Manual Build (Directly in Live Folder) ---');
        console.log(`Working directory: ${liveDir}`);
        const buildCmd = `cd ${liveDir} && npm install && npm run build`;
        const buildResult = await ssh.execCommand(buildCmd);
        console.log(buildResult.stdout);
        if (buildResult.stderr) console.error(buildResult.stderr);

        // --- Phase 3: Start Services ---
        console.log('\n--- Phase 3: Start Services with Correct Paths ---');
        await ssh.execCommand(`pm2 start npm --name "frontend" --cwd ${liveDir} -- start`);
        await ssh.execCommand('pm2 start index.js --name "man2man-backend" --cwd /var/www/man2man');

        // --- Phase 4: Final Verification ---
        console.log('\n--- Phase 4: Verification (Curl) ---');
        console.log('Waiting 5s for Next.js to wake up...');
        await new Promise(r => setTimeout(r, 5000));
        
        const curlRes = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curlRes.stdout || 'Curl failed!');

        console.log('\nEMERGENCY MANUAL RECOVERY completed. Site should be LIVE.');
        ssh.dispose();
    } catch (err) {
        console.error('Emergency Manual Recovery Failed:', err);
        ssh.dispose();
    }
}
emergencyRecoverManual();
