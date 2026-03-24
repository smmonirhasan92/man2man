const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readFile() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- UnifiedWallet.js Content (Lines 35-55) ---');
        const res1 = await ssh.execCommand('sed -n "35,55p" /var/www/man2man/frontend/components/layout/UnifiedWallet.js');
        console.log(res1.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
readFile();
