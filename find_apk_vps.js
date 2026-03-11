const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        const r = await ssh.execCommand('find /var/www/man2man -name "*.apk"');
        console.log('--- FOUND APK FILES ---');
        console.log(r.stdout || 'NONE FOUND');
        console.log('------------------------');
        ssh.dispose();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
