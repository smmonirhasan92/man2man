const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function masterFix() {
    try {
        console.log('--- Connecting to VPS for Master Fix ---');
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        
        console.log('1. Clearing duplicate PM2 apps & killing blocked ports');
        await ssh.execCommand('pm2 delete all', { cwd: '/var/www/man2man' });
        await ssh.execCommand('fuser -k 3000/tcp');
        await ssh.execCommand('fuser -k 5050/tcp');
        
        console.log('1.5 Pulling the latest fixed codebase');
        const git = await ssh.execCommand('git fetch origin main && git reset --hard origin/main', { cwd: '/var/www/man2man' });
        console.log(git.stdout);
        
        console.log('2. Removing broken Next.js build cache');
        await ssh.execCommand('rm -rf /var/www/man2man/frontend/.next /var/www/man2man/frontend/node_modules/.cache');

        console.log('3. Running Next.js Build (with memory allocation)');
        const build = await ssh.execCommand('cd /var/www/man2man/frontend && export NODE_OPTIONS=--max_old_space_size=1024 && npm run build');
        console.log(build.stdout);
        console.error(build.stderr);
        
        if (build.code !== 0) {
            console.log('\n--- BUILD FAILED... Trying alternate memory setting ---');
            const b2 = await ssh.execCommand('cd /var/www/man2man/frontend && export NODE_OPTIONS=--max_old_space_size=512 && npm run build');
            console.log(b2.stdout);
            console.error(b2.stderr);
            if(b2.code !== 0) {
               console.error("Next build completely failed.");
            }
        }

        console.log('4. Starting Ecosystem');
        const start = await ssh.execCommand('pm2 start ecosystem.config.js', { cwd: '/var/www/man2man' });
        console.log(start.stdout);
        
        console.log('5. Saving PM2 config');
        await ssh.execCommand('pm2 save');
        
        console.log('✅ Fix Complete!');
        ssh.dispose();
    } catch(err) {
        console.error(err);
    }
}
masterFix();
