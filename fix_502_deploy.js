const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function fixDeployment() {
    try {
        console.log('--- Connecting to VPS for Emergency Fix ---');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        console.log('✅ Connected.');

        const commands = [
            { name: 'Stop PM2 to free RAM', cmd: 'pm2 stop all' },
            { name: 'Git Repo Reset', cmd: 'cd /var/www/man2man && git pull origin main' },
            { name: 'Clear Next.js Cache', cmd: 'rm -rf /var/www/man2man/frontend/.next' },
            { name: 'NPM Install Check', cmd: 'cd /var/www/man2man/frontend && npm install' },
            { name: 'Build Next.js Frontend', cmd: 'cd /var/www/man2man/frontend && export NODE_OPTIONS=--max_old_space_size=1024 && npm run build' },
            { name: 'Restart PM2', cmd: 'cd /var/www/man2man && pm2 start all || pm2 restart all' }
        ];

        for (let task of commands) {
            console.log(`\n🚀 Executing: [${task.name}]`);
            const res = await ssh.execCommand(task.cmd, {
                onStdout: chunk => process.stdout.write(chunk.toString('utf8')),
                onStderr: chunk => process.stderr.write(chunk.toString('utf8')),
            });
            if (res.code !== 0) {
                console.error(`❌ Task '${task.name}' failed with code ${res.code}.`);
                if (task.name === 'Build Next.js Frontend') {
                    console.log('Trying an alternate build strategy (local swap / limit)...');
                    await ssh.execCommand('cd /var/www/man2man/frontend && export NODE_OPTIONS=--max_old_space_size=512 && npm run build', {
                        onStdout: chunk => process.stdout.write(chunk.toString('utf8')),
                        onStderr: chunk => process.stderr.write(chunk.toString('utf8')),
                    });
                }
            } else {
                console.log(`✅ [${task.name}] completed successfully.`);
            }
        }
        ssh.dispose();
        console.log('\n✅ Deployment Fix Completed. Site should be LIVE.');
    } catch (err) {
        console.error('Connection Error:', err);
    }
}
fixDeployment();
