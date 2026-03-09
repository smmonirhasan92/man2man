const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        console.log('Executing final_production_purge.js on VPS...');
        // We use absolute path for node and script to avoid any ambiguity
        const res = await ssh.execCommand('node scripts/final_production_purge.js', {
            cwd: '/var/www/man2man/backend'
        });

        console.log('--- VPS STDOUT ---');
        console.log(res.stdout);
        console.log('--- VPS STDERR ---');
        console.log(res.stderr);

        if (res.code === 0 && !res.stderr.includes('Error:')) {
            console.log('\n✅ COMPREHENSIVE PURGE COMPLETED SUCCESSFULLY ✅');
        } else {
            console.log('\n❌ PURGE FAILED OR HAD ERRORS ❌');
        }

    } catch (e) {
        console.error('Local Execution Error:', e);
    } finally {
        ssh.dispose();
    }
}

run();
