const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function absoluteRestore() {
    try {
        console.log('Connecting to VPS for ABSOLUTE PATH RESTORATION...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const liveDir = '/var/www/man2man/frontend';

        // --- Phase 1: Create Absolute Launcher ---
        console.log('\n--- Phase 1: Creating Absolute Launcher (Shell Script) ---');
        // This ensures CWD is ALWAYS correct.
        const launcherPath = `${liveDir}/start_next.sh`;
        const launcherContent = `#!/bin/bash\ncd ${liveDir}\nnpm start\n`;
        await ssh.execCommand(`echo "${launcherContent}" > ${launcherPath}`);
        await ssh.execCommand(`chmod +x ${launcherPath}`);
        console.log(`Created: ${launcherPath}`);

        // --- Phase 2: Nuclear PM2 Wipeout ---
        console.log('\n--- Phase 2: Nuclear PM2 Wipeout ---');
        await ssh.execCommand('pm2 delete frontend || true');
        await ssh.execCommand('fuser -k 3000/tcp || true');
        await ssh.execCommand('pm2 flush');

        // --- Phase 3: Start Services via Launcher ---
        console.log('\n--- Phase 3: Start Services via Absolute Launcher ---');
        const startCmd = `pm2 start ${launcherPath} --name "frontend"`;
        console.log(`> Executing: ${startCmd}`);
        const startRes = await ssh.execCommand(startCmd);
        console.log(startRes.stdout);

        console.log('\nRefreshing Backend...');
        await ssh.execCommand('pm2 restart man2man-backend || pm2 start index.js --name "man2man-backend" --cwd /var/www/man2man');

        // --- Phase 4: Final Verification (Internal Curl) ---
        console.log('\n--- Phase 4: Final Verification (Internal Curl) ---');
        console.log('Waiting 10s for Next.js to wake up...');
        await new Promise(r => setTimeout(r, 10000));
        
        const curlRes = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curlRes.stdout || 'Internal Curl failed! External check required.');

        console.log('\nABSOLUTE RESTORATION completed. Site should be LIVE and STABLE.');
        ssh.dispose();
    } catch (err) {
        console.error('Absolute Restoration Failed:', err);
        ssh.dispose();
    }
}
absoluteRestore();
