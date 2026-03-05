const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkP2Remote() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const testScriptBase64 = Buffer.from(`
require('dotenv').config({path: '/var/www/man2man/backend/.env'});
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const P2PService = require('./modules/p2p/P2PService');
    try {
        const stats = await P2PService.getMarketSummary();
        console.log("==> P2P SERVICE RETURN PAYLOAD:");
        console.log(JSON.stringify(stats, null, 2));
    } catch(e) {
        console.log("==> ERROR:", e);
    }
    process.exit(0);
});
        `).toString('base64');

        console.log('Executing script...');
        const r2 = await ssh.execCommand(\`echo "\${testScriptBase64}" | base64 -d > remote_check_p2p_b64.js && node remote_check_p2p_b64.js\`, {cwd: '/var/www/man2man/backend'});
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch(err) {
        console.log(err);
    }
}
checkP2Remote();
