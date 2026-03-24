const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPm2() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- PM2 List ---');
        const res1 = await ssh.execCommand('pm2 list');
        console.log(res1.stdout);

        console.log('--- PM2 Describe (man2man-frontend) ---');
        const res2 = await ssh.execCommand('pm2 describe man2man-frontend || pm2 describe frontend');
        console.log(res2.stdout);

        console.log('--- Grep WalletSwap.js for USD/NXS ---');
        const res3 = await ssh.execCommand('grep -E "USD Amount|NXS Amount" /var/www/man2man/frontend/components/wallet/WalletSwap.js');
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkPm2();
