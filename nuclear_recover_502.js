const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nuclearRecover() {
    try {
        console.log('Connecting to VPS for NUCLEAR 502 RECOVERY...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const liveDir = '/var/www/man2man/frontend';

        // --- Phase 1: Wipe Out Stale Process ---
        console.log('\n--- Phase 1: Wipe Out Stale Process & Port ---');
        await ssh.execCommand('pm2 stop frontend');
        await ssh.execCommand('pm2 delete frontend');
        await ssh.execCommand('fuser -k 3000/tcp || true');
        await ssh.execCommand('pm2 flush');

        // --- Phase 2: Fresh Start (Absolute CWD) ---
        console.log('\n--- Phase 2: Fresh Start with Absolute CWD ---');
        const startCmd = `pm2 start npm --name "frontend" --cwd ${liveDir} -- start`;
        console.log(`> Executing: ${startCmd}`);
        const startRes = await ssh.execCommand(startCmd);
        console.log(startRes.stdout);

        console.log('\nRefreshing Backend...');
        await ssh.execCommand('pm2 restart man2man-backend');

        // --- Phase 3: Immediate Verification (Curl) ---
        console.log('\n--- Phase 3: Verification (Curl) ---');
        console.log('Waiting 10s for Next.js to start completely...');
        await new Promise(r => setTimeout(r, 10000));
        
        const curlRes = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curlRes.stdout || 'Curl failed! Site might still be down.');

        console.log('\nNUCLEAR RECOVERY completed. Site should be LIVE.');
        ssh.dispose();
    } catch (err) {
        console.error('Nuclear Recovery Failed:', err);
        ssh.dispose();
    }
}
nuclearRecover();
