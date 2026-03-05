const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- GIT RESET & PULL ---');
        // Force reset the git tree on the VPS to match origin/main
        const r1 = await ssh.execCommand('git fetch origin main && git reset --hard origin/main', { cwd: '/var/www/man2man' });
        console.log(r1.stdout);
        console.log(r1.stderr);

        console.log('--- NPM BUILD --');
        await ssh.execCommand('npm run build', { cwd: '/var/www/man2man/frontend' });

        console.log('--- PM2 RESTART --');
        await ssh.execCommand('pm2 restart all', { cwd: '/var/www/man2man' });

        console.log('Deployment fixed and pushed!');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
check();
