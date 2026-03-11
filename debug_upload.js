const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function uploadFiles() {
    try {
        console.log('Connecting to SSH...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });
        console.log('Connected.');

        const files = [
            { local: 'd:/man2man/frontend/components/PWAInstallPrompt.js', remote: '/var/www/man2man/frontend/components/PWAInstallPrompt.js' },
            { local: 'd:/man2man/frontend/app/login/page.js', remote: '/var/www/man2man/frontend/app/login/page.js' },
            { local: 'd:/man2man/frontend/app/register/page.js', remote: '/var/www/man2man/frontend/app/register/page.js' }
        ];

        for (const f of files) {
            console.log(`Uploading ${f.local} -> ${f.remote}`);
            await ssh.putFile(f.local, f.remote);
            console.log('Success.');
        }

        console.log('Running deploy.sh...');
        const result = await ssh.execCommand('./deploy.sh', { cwd: '/var/www/man2man' });
        console.log('STDOUT:', result.stdout);
        console.log('STDERR:', result.stderr);

        console.log('Done.');
        ssh.dispose();
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        ssh.dispose();
        process.exit(1);
    }
}

uploadFiles();
