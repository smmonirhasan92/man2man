const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nuclearFix() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Stopping PM2 and killing node processes...');
        await ssh.execCommand('pm2 stop all');
        await ssh.execCommand('pkill -9 node');
        
        console.log('Deleting server.js and .env (to be sure)...');
        await ssh.execCommand('rm -f backend/server.js', { cwd: '/var/www/man2man' });
        await ssh.execCommand('rm -f backend/.env', { cwd: '/var/www/man2man' });

        console.log('Uploading clean server.js...');
        await ssh.putFile('d:/man2man/backend/server.js', '/var/www/man2man/backend/server.js');
        
        console.log('Restoring .env content...');
        const envContent = `PORT=5055
MONGODB_URI=mongodb://127.0.0.1:27017/universal_game_core_v1
JWT_SECRET=supersecretkeyremitwallet123
NODE_ENV=production
SUPER_ADMIN_SEC_KEY_1=1111
SUPER_ADMIN_SEC_KEY_2=2222
SUPER_ADMIN_SEC_KEY_3=3333
VAPID_PUBLIC_KEY=BA-E3dG_kEVVQZYlu1yELQKY-g08TM_3fzoBmYOM6EUVWlcXK-0LKNmL_asu7-Zu1OQa_iWWb6NugwtnBlfSHpM
VAPID_PRIVATE_KEY=eFT_o7c8jcEoaig75nkj14E26-7VwoGXRBXc6BQBTv8
VAPID_EMAIL=admin@man2man.host
`;
        await ssh.execCommand(`echo "${envContent}" > backend/.env`, { cwd: '/var/www/man2man' });

        console.log('Verifying MD5...');
        const resMD5 = await ssh.execCommand('md5sum backend/server.js', { cwd: '/var/www/man2man' });
        console.log('VPS MD5:', resMD5.stdout);

        console.log('Starting PM2 processes...');
        await ssh.execCommand('pm2 start server.js --name man2man-backend --cwd /var/www/man2man/backend');
        await ssh.execCommand('pm2 start "npm run start" --name man2man-frontend --cwd /var/www/man2man/frontend');
        
        console.log('Restarting Nginx...');
        await ssh.execCommand('systemctl restart nginx');

        console.log('Final check in 5s...');
        setTimeout(async () => {
             const resStatus = await ssh.execCommand('pm2 list');
             console.log(resStatus.stdout);
             const resPort = await ssh.execCommand('netstat -tunlp | grep -E \":5055|:3000\"');
             console.log(resPort.stdout);
             ssh.dispose();
        }, 5000);

    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nuclearFix();
