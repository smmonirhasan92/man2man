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

        await ssh.putFile('d:\\man2man\\remote_check_db.js', '/var/www/man2man/backend/test_api_clean.js');
        const scriptBody = `
        require('dotenv').config({path: '/var/www/man2man/backend/.env'});
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI).then(async () => {
            const P2PService = require('./modules/p2p/P2PService');
            try {
                const stats = await P2PService.getMarketSummary();
                console.log("=> API TEST OUTPUT:");
                console.log(JSON.stringify(stats, null, 2));
            } catch(e) {
                console.log("=> ERROR:", e);
            }
            process.exit(0);
        });
        `;
        // Instead of putFile which is acting up with absolute paths, use SFTP streams? Or just use writeFileSync inside node e!
        const inlineNode = `require('fs').writeFileSync('test_api_clean.js', Buffer.from('${Buffer.from(scriptBody).toString('base64')}', 'base64').toString('utf-8'));`;

        await ssh.execCommand(`node -e "${inlineNode}"`, { cwd: '/var/www/man2man/backend' });
        const r2 = await ssh.execCommand(`node test_api_clean.js`, { cwd: '/var/www/man2man/backend' });

        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
execTest();
