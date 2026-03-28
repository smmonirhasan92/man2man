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

        const commands = [
            `pm2 status`,
            `pm2 logs --lines 50 --nostream`
        ];

        for (const cmd of commands) {
            console.log(`\n> Executing: ${cmd}`);
            const result = await ssh.execCommand(cmd);
            if (result.stdout) console.log(result.stdout);
            if (result.stderr) console.error(result.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
    }
}
check();
