const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFile() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- READING P2PService.js ---');
        const r1 = await ssh.execCommand('cat /var/www/man2man/backend/modules/p2p/P2PService.js | grep chartData', { cwd: '/var/www' });
        console.log("Stdout:");
        console.log(r1.stdout);
        console.log("Stderr:");
        console.log(r1.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkFile();
