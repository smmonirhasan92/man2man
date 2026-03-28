const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function diagnose() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- 1. FULL PM2 STATUS ---');
        const listRes = await ssh.execCommand('pm2 list');
        console.log(listRes.stdout);

        console.log('\n--- 2. FRONTEND DETAILS ---');
        const showRes = await ssh.execCommand('pm2 show frontend');
        console.log(showRes.stdout);

        console.log('\n--- 3. RECENT FRONTEND ERRORS ---');
        const logRes = await ssh.execCommand('pm2 logs frontend --lines 30 --nostream');
        console.log(logRes.stdout);

        console.log('\n--- 4. DIRECTORY CHECK ---');
        const lsRes = await ssh.execCommand('ls -la /var/www/man2man/frontend');
        console.log(lsRes.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Diagnosis Failed:', err);
        ssh.dispose();
    }
}
diagnose();
