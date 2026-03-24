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
        
        console.log('--- WalletSwap.js Content (Lines 80-90) ---');
        const res1 = await ssh.execCommand('sed -n "80,95p" /var/www/man2man/frontend/components/wallet/WalletSwap.js');
        console.log(res1.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
readFile();
