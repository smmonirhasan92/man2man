const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function captureDetailedLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });
        console.log('✅ Connected.');

        console.log('--- Running Build and capturing Logs ---');
        // We use redirect to capture both stderr and stdout
        const buildResult = await ssh.execCommand('cd /var/www/man2man/frontend && npm run build > build_debug.log 2>&1', { cwd: '/var/www/man2man/frontend' });
        
        console.log(`Build Finished with code: ${buildResult.code}`);
        
        const logContent = await ssh.execCommand('tail -n 50 /var/www/man2man/frontend/build_debug.log');
        console.log('\n--- LAST 50 LINES OF LOG ---');
        console.log(logContent.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('❌ Error:', err);
        ssh.dispose();
    }
}

captureDetailedLogs();
