const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function forceClean() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Phase 1: Cleaning Build Cache ---');
        await ssh.execCommand('rm -rf .next', { cwd: '/var/www/man2man/frontend' });
        
        console.log('--- Phase 2: Fresh Rebuild ---');
        const buildRes = await ssh.execCommand('npm run build', { cwd: '/var/www/man2man/frontend' });
        console.log(buildRes.stdout);
        
        console.log('--- Phase 3: PM2 Restart ---');
        await ssh.execCommand('pm2 restart all');
        
        console.log('DONE.');
        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
forceClean();
