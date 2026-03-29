const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log('--- Connecting to VPS (76.13.244.202) ---');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        console.log('✅ Connected.');

        const commands = [
            { id: 'GIT', cmd: 'cd /var/www/man2man && git pull origin main' },
            { id: 'NPM', cmd: 'cd /var/www/man2man && npm install' },
            { id: 'BUILD', cmd: 'cd /var/www/man2man/frontend && NODE_OPTIONS="--max-old-space-size=4096" npm run build', timeout: 900000 },
            { id: 'PM2', cmd: 'pm2 restart all' }
        ];

        for (const item of commands) {
            console.log(`\n🚀 [${item.id}] Executing: ${item.cmd}`);
            const result = await ssh.execCommand(item.cmd, { 
                cwd: '/var/www/man2man',
                onStdout: (chunk) => process.stdout.write(chunk.toString()),
                onStderr: (chunk) => process.stderr.write(chunk.toString())
            });
            
            if (result.code !== 0) {
                console.error(`\n❌ [${item.id}] Command failed with code ${result.code}`);
                if (item.id === 'BUILD') {
                    console.warn('⚠️ Build failed. Check RAM/Logs.');
                }
                // Don't stop on NPM warnings if they occur
                if (item.id !== 'NPM') return;
            } else {
                console.log(`\n✅ [${item.id}] Completed successfully.`);
            }
        }

        console.log('\n✅ Deployment Finished.');
        ssh.dispose();
    } catch (err) {
        console.error('❌ Connection Error:', err);
        ssh.dispose();
    }
}

deploy();
