const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log("Connecting to Hostinger VPS...");
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            readyTimeout: 20000
        });
        console.log("Connected! Force Pulling latest code from GitHub...");

        const gitFetch = await ssh.execCommand('git fetch origin main', { cwd: '/var/www/man2man' });
        console.log("Git Fetch:", gitFetch.stdout, gitFetch.stderr);

        const gitReset = await ssh.execCommand('git reset --hard origin/main', { cwd: '/var/www/man2man' });
        console.log("Git Reset:", gitReset.stdout);
        if (gitReset.stderr) console.error("Git Reset Error:", gitReset.stderr);

        console.log("Rebuilding Frontend...");
        const build = await ssh.execCommand('npm run build', { cwd: '/var/www/man2man/frontend' });
        console.log("Build Output:", build.stdout);
        if (build.stderr) console.error("Build Stderr:", build.stderr);

        console.log("Restarting ALL PM2 Processes (Frontend + Backend)...");
        const pm2 = await ssh.execCommand('pm2 restart all', { cwd: '/var/www/man2man' });
        console.log("PM2 Output:", pm2.stdout);

        console.log("Deployment Complete!");
    } catch (err) {
        console.error("SSH Deployment failed:", err);
    } finally {
        ssh.dispose();
    }
}

deploy();
