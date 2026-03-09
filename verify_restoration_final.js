const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verifyRestoration() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Netstat Check (Post-Reset) ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep -E "3000|5050"');
        console.log(netstat.stdout || "STILL NOT LISTENING ON 3000/5050");

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log("--- Testing Frontend Local (Port 3000) ---");
        const fe = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(fe.stdout);

        console.log("--- Testing Backend Local (Port 5050) ---");
        const be = await ssh.execCommand('curl -I http://localhost:5050/api/auth/me');
        console.log(be.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
verifyRestoration();
