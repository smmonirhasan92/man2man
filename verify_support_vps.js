const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verifySupport() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Testing Endpoints ---");
        // We use -s to suppress progress meter and -o /dev/null to show only the status code
        const endpoints = [
            '/api/support/my-messages',
            '/api/support/all',
            '/api/support/send',
            '/api/support/reply'
        ];

        for (const ep of endpoints) {
            const res = await ssh.execCommand(`curl -o /dev/null -s -w "%{http_code}" http://localhost:5050${ep}`);
            console.log(`${ep}: ${res.stdout}`);
        }

        console.log("\n--- Backend Logs (Support Filter) ---");
        const logs = await ssh.execCommand('pm2 logs man2man-backend --lines 100 --nostream --no-colors');
        const filter = logs.stdout.split('\n').filter(line => line.includes('support') || line.includes('TRACER'));
        console.log(filter.join('\n'));

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
verifySupport();
