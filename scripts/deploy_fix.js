const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deployFix() {
    console.log('--- STARTING GITHUB ROLLBACK & DEPLOYMENT ---');
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('[1/4] Overwriting VPS error with precise GitHub branch code...');
        const git = await ssh.execCommand('cd /var/www/man2man && git fetch origin && git reset --hard origin/main');
        console.log(git.stdout || git.stderr);

        console.log('[2/4] Installing backend dependencies...');
        const bInstall = await ssh.execCommand('cd /var/www/man2man && npm install');
        console.log(bInstall.stdout.slice(-200) || bInstall.stderr);

        console.log('[3/4] Rebuilding frontend (this clears the cache completely)...');
        // Setting max memory for NextJS build just in case VPS is low on RAM
        const build = await ssh.execCommand('cd /var/www/man2man/frontend && npm install && rm -rf .next && export NODE_OPTIONS=--max_old_space_size=1024 && npm run build');
        console.log(build.stdout.slice(-500) || build.stderr);

        console.log('[4/4] Restarting PM2 Cluster...');
        const pm2 = await ssh.execCommand('pm2 restart all');
        console.log(pm2.stdout.slice(-200) || pm2.stderr);

        console.log('✅ ALL DONE! The system has been fully restored to GitHub standard.');
        ssh.dispose();
        process.exit(0);
    } catch (err) {
        console.error('❌ DEPLOY FAILED:', err);
        ssh.dispose();
        process.exit(1);
    }
}
deployFix();
