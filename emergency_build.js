const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fix() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log("1. Killing ALL PM2 and unblocking ports...");
        await ssh.execCommand('pm2 kill && killall -9 node || true');
        await ssh.execCommand('fuser -k 3000/tcp || true');
        
        console.log("2. Cleaning old builds...");
        await ssh.execCommand('cd /var/www/man2man/frontend && rm -rf .next');
        
        console.log("3. Ensuring Swap Memory is active...");
        await ssh.execCommand('swapon /swapfile || true');
        
        console.log("4. Building Frontend (Streaming output)...");
        const buildRes = await ssh.execCommand('cd /var/www/man2man/frontend && export NODE_OPTIONS=--max_old_space_size=2560 && npm run build');
        console.log(buildRes.stdout);
        if(buildRes.stderr) console.error(buildRes.stderr);

        if (buildRes.stdout.includes('compiled client and server successfully') || buildRes.stdout.includes('.next')) {
            console.log("5. Starting ONLY ONE backend and ONE frontend...");
            await ssh.execCommand('cd /var/www/man2man/backend && pm2 start server.js --name "backend"');
            await ssh.execCommand('cd /var/www/man2man/frontend && pm2 start npm --name "frontend" -- start');
            await ssh.execCommand('pm2 save');
            console.log("6. SUCCESS!");
        } else {
             console.log("Build failed. Did not start PM2 to prevent infinite crash loop.");
        }
        ssh.dispose();
    } catch (err) {
        console.error('Fatal:', err);
        ssh.dispose();
    }
}
fix();
