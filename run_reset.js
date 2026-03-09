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

        console.log('Executing production_reset.js on VPS...');
        // We run it with an explicit NODE_PATH if needed, but normally CWD should work.
        // Let's try to run it and capture everything.
        const res = await ssh.execCommand('node scripts/production_reset.js', {
            cwd: '/var/www/man2man/backend'
        });

        console.log('--- VPS STDOUT ---');
        console.log(res.stdout);
        console.log('--- VPS STDERR ---');
        console.log(res.stderr);

        if (res.code === 0 && !res.stderr.includes('Error:')) {
            console.log('Reset reported success on VPS!');
        } else {
            console.log('Reset FAILED on VPS. Code:', res.code);
        }

    } catch (e) {
        console.error('Local Error:', e);
    } finally {
        ssh.dispose();
    }
}

run();
