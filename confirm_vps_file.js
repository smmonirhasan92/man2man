const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFinal() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- WalletSwap.js HEAD ---');
        const res = await ssh.execCommand('cat /var/www/man2man/frontend/components/wallet/WalletSwap.js | grep -C 5 "Amount:"');
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkFinal();
