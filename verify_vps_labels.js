const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verify() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- UnifiedWallet.js Content (VPS) ---');
        const res1 = await ssh.execCommand('grep -E "USD Balance|NXS Income|Fund Transfer" /var/www/man2man/frontend/components/layout/UnifiedWallet.js /var/www/man2man/frontend/components/wallet/WalletSwap.js');
        console.log(res1.stdout || 'Match NOT found on VPS');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
verify();
