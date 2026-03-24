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
        
        console.log('--- VPS PUBLIC FILE CHECK ---');
        const files = await ssh.execCommand('ls -l frontend/public/', { cwd: '/var/www/man2man' });
        console.log(files.stdout || files.stderr);
        
        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkPWA();
