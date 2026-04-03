const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalize() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        console.log('Connected!');

        const commands = [
            { cmd: 'pm2 start app.js --name man2man-backend', cwd: '/var/www/man2man/backend' },
            { cmd: 'pm2 start "npm run start" --name man2man-frontend', cwd: '/var/www/man2man/frontend' },
            { cmd: 'systemctl restart nginx', cwd: '/var/www/man2man' }
        ];

        for (const item of commands) {
            console.log(`Executing: ${item.cmd} in ${item.cwd}`);
            const res = await ssh.execCommand(item.cmd, { cwd: item.cwd });
            console.log(res.stdout || res.stderr);
            if (res.code !== 0) {
                console.error(`Error: ${res.code}`);
            }
        }

        console.log('Restoration Finalized!');
        ssh.dispose();
    } catch (err) {
        console.error('Finalization Failed:', err);
        ssh.dispose();
    }
}

finalize();
