const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function portFix() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Stopping backend...');
        await ssh.execCommand('pm2 stop man2man-backend');
        
        console.log('Updating .env to Port 5050...');
        const envContent = `PORT=5050
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

        console.log('Restarting backend on 5050...');
        await ssh.execCommand('pm2 start man2man-backend');
        
        console.log('Restarting Nginx...');
        await ssh.execCommand('systemctl restart nginx');

        console.log('Verification in 3s...');
        setTimeout(async () => {
             const resStatus = await ssh.execCommand('pm2 list');
             console.log(resStatus.stdout);
             const resPort = await ssh.execCommand('netstat -tunlp | grep \":5050\"');
             console.log(resPort.stdout);
             const resCurl = await ssh.execCommand('curl -I http://127.0.0.1:5050/health');
             console.log(resCurl.stdout);
             ssh.dispose();
        }, 3000);

    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
portFix();
