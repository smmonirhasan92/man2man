const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function execTest() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const testScript = `
        require('dotenv').config({path: '/var/www/man2man/backend/.env'});
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI).then(async () => {
            const P2PService = require('./modules/p2p/P2PService');
            try {
                const stats = await P2PService.getMarketSummary();
                console.log("==> STATS OUTPUT:");
                console.log(JSON.stringify(stats, null, 2));
            } catch(e) {
                console.log("==> STATS ERROR:");
                console.log(e);
            }
            process.exit(0);
        });
        `;

        await ssh.execCommand(`echo "${testScript.split('\n').join('\\n').replace(/"/g, '\\"')}" > test_run.js`, { cwd: '/var/www/man2man/backend' });
        const r2 = await ssh.execCommand('node test_run.js', { cwd: '/var/www/man2man/backend' });
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
execTest();
