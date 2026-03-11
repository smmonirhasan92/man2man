const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkVPS() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        console.log('--- Manifest Content ---');
        const manifest = await ssh.execCommand('cat /var/www/man2man/frontend/public/manifest.json');
        console.log(manifest.stdout);

        console.log('--- Sounds Directory ---');
        const sounds = await ssh.execCommand('ls -lh /var/www/man2man/frontend/public/sounds');
        console.log(sounds.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Check failed:', err);
        ssh.dispose();
    }
}

checkVPS();
