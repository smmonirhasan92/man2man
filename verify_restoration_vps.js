const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verify() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 Status ---");
        const res = await ssh.execCommand('pm2 status man2man-backend');
        console.log(res.stdout);

        console.log("\n--- Checking Port 5050 ---");
        const netstat = await ssh.execCommand('netstat -tulnp | grep 5050');
        console.log(netstat.stdout || 'Port 5050 NOT LISTENING');

        if (netstat.stdout) {
            console.log("\n--- Smoke Test Endpoints ---");
            const ep = '/api/support/my-messages';
            const test = await ssh.execCommand(`curl -o /dev/null -s -w "%{http_code}" http://localhost:5050${ep}`);
            console.log(ep + ": HTTP " + test.stdout);
        }

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
verify();
