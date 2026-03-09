const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function audit() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- LS -R /var/www/man2man/backend ---");
        const res = await ssh.execCommand('find /var/www/man2man/backend -maxdepth 3');
        console.log(res.stdout);

        console.log("\n--- Integrity Check: server.js Content ---");
        const grep = await ssh.execCommand('grep -n "supportRoutes" /var/www/man2man/backend/server.js');
        console.log(grep.stdout);

        console.log("\n--- Manual Node Require Test (from backend dir) ---");
        const testScript = "try { require('./routes/supportRoutes'); console.log('RESOLVED OK'); } catch(e) { console.log('RESOLVE FAIL:', e.message); }";
        const nodeRes = await ssh.execCommand(`node -e "${testScript}"`, { cwd: '/var/www/man2man/backend' });
        console.log(nodeRes.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
audit();
