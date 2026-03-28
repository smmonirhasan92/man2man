const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkHealth() {
    try {
        console.log('Connecting to Live VPS [76.13.244.202]...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Connected! Fetching PM2 Instances & Error Logs...\n');

        const commands = [
            'pm2 status',
            'pm2 logs --nostream --lines 20',
            'tail -n 15 /var/log/nginx/error.log || echo "No recent Nginx errors."'
        ];

        for (const cmd of commands) {
            console.log(`\n--- [ RUNNING: ${cmd} ] ---`);
            const result = await ssh.execCommand(cmd);
            if (result.stdout) console.log(result.stdout);
            if (result.stderr) console.error(result.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Failed to check health:', err);
        if(ssh) ssh.dispose();
    }
}

checkHealth();
