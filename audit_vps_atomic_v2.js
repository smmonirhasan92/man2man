const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditFolders() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- 1. Directory Structure (/var/www) ---');
        const res1 = await ssh.execCommand('ls -la /var/www');
        console.log(res1.stdout);

        console.log('\n--- 2. Checking Code content (/var/www/man2man/frontend/components/p2p/OrderCreationModal.js) ---');
        const res2 = await ssh.execCommand('grep "accountType" frontend/components/p2p/OrderCreationModal.js | head -n 5', { cwd: '/var/www/man2man' });
        console.log(res2.stdout || 'NOT FOUND IN LIVE!');

        console.log('\n--- 3. Checking Build content (/var/www/man2man_build/frontend/components/p2p/OrderCreationModal.js) ---');
        const res3 = await ssh.execCommand('grep "accountType" frontend/components/p2p/OrderCreationModal.js | head -n 5', { cwd: '/var/www/man2man_build' });
        console.log(res3.stdout || 'NOT FOUND IN BUILD!');

        console.log('\n--- 4. Active Frontend PM2 Stats ---');
        const res4 = await ssh.execCommand('pm2 show frontend');
        console.log(res4.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
auditFolders();
