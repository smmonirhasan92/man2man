const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testApi() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- TEST LOCALHOST API BEHIND AUTH ---');
        // Let's create an admin token internally or just use the generic getMarketSummary from a script!
        const scriptBody = `
        require('dotenv').config({path: '/var/www/man2man/backend/.env'});
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI).then(async () => {
            const P2PService = require('./modules/p2p/P2PService');
            try {
                const stats = await P2PService.getMarketSummary();
                console.log(JSON.stringify(stats, null, 2));
            } catch(e) {
                console.log(e);
            }
            process.exit(0);
        });
        `;

        await ssh.putFile('/dev/null', '/var/www/man2man/backend/test_p2p.js'); // Empty file first 
        const r1 = await ssh.execCommand(`echo "${scriptBody.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > test_p2p.js`, { cwd: '/var/www/man2man/backend' });

        const r2 = await ssh.execCommand('node test_p2p.js', { cwd: '/var/www/man2man/backend' });
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
testApi();
