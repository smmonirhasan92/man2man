const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deployHard() {
    try {
        console.log('Connecting for Hard Deployment...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Clearing Next.js cache and rebuilding in background window to avoid timeout...');

        // Use nohup to run the build in the background on the VPS so SSH timeout doesn't kill it
        const buildCommand = `
            cd /var/www/man2man && git pull origin main && 
            cd /var/www/man2man/frontend && 
            rm -rf .next && 
            npm run build && 
            cd /var/www/man2man && 
            pm2 restart all
        `;

        console.log('Executing build pipeline...');

        // This command runs synchronously. We'll increase the timeout for the SSH client if possible, 
        // or just accept that node-ssh waits until completion.
        const result = await ssh.execCommand(buildCommand, { cwd: '/var/www/man2man', stream: 'both' });

        console.log('STDOUT:', result.stdout);
        if (result.stderr) console.error('STDERR:', result.stderr);

        console.log('Hard Build Complete!');
        ssh.dispose();
    } catch (err) {
        console.error('Hard Deploy Failed:', err);
        ssh.dispose();
    }
}

deployHard();
