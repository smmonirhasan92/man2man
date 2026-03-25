const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function huntProcess() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Phase 1: All Node Processes ---');
        const res1 = await ssh.execCommand('ps aux | grep node');
        console.log(res1.stdout);

        console.log('--- Phase 2: PM2 Detailed JList ---');
        const res2 = await ssh.execCommand('pm2 jlist');
        console.log(res2.stdout);

        console.log('--- Phase 3: Searching for ANY WalletSwap.js on disk ---');
        const res3 = await ssh.execCommand('find / -name "WalletSwap.js" 2>/dev/null');
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
huntProcess();
