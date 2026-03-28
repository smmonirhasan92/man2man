const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function emergencyRecover502() {
    try {
        console.log('Connecting to VPS for EMERGENCY 502 RECOVERY...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        // --- Phase 1: Total Stop ---
        console.log('\n--- Phase 1: Total Stop ---');
        await ssh.execCommand('pm2 stop all');
        await ssh.execCommand('fuser -k 3000/tcp || true');
        await ssh.execCommand('pm2 flush');

        // --- Phase 2: Corrected Restart ---
        console.log('\n--- Phase 2: Corrected Restart (Absolute Path) ---');
        // We MUST start with the correct CWD to avoid 'Cannot find module package.json'
        const startFrontend = 'pm2 start npm --name "frontend" --cwd /var/www/man2man/frontend -- start';
        console.log(`> Executing: ${startFrontend}`);
        await ssh.execCommand(startFrontend);

        const startBackend = 'pm2 start index.js --name "man2man-backend" --cwd /var/www/man2man';
        console.log(`> Executing: ${startBackend}`);
        await ssh.execCommand(startBackend);

        // --- Phase 3: Immediate Verification ---
        console.log('\n--- Phase 3: Immediate Verification (Curl) ---');
        // Give it 5 seconds to wake up
        console.log('Waiting 5s for Next.js to wake up...');
        await new Promise(r => setTimeout(r, 5000));
        
        const curlRes = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curlRes.stdout || 'Curl failed!');

        console.log('\nEMERGENCY 502 RECOVERY completed. Please check the website.');
        ssh.dispose();
    } catch (err) {
        console.error('Emergency Recovery Failed:', err);
        ssh.dispose();
    }
}
emergencyRecover502();
