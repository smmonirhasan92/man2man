const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPWA() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- VPS PWA FILE CHECK ---');
        const files = await ssh.execCommand('ls -l public/manifest.json public/icon-*', { cwd: '/var/www/man2man/frontend' });
        console.log(files.stdout || files.stderr);
        
        console.log('\n--- PM2 STATUS ---');
        const pm2 = await ssh.execCommand('pm2 list');
        console.log(pm2.stdout);
        
        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkPWA();
