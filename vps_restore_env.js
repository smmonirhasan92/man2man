const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

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

async function restore() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Restoring .env...');
        await ssh.execCommand(`echo "${envContent}" > backend/.env`, { cwd: '/var/www/man2man' });
        
        console.log('Restarting PM2 backend...');
        await ssh.execCommand('pm2 restart man2man-backend');
        
        console.log('Verifying port 5055...');
        const res = await ssh.execCommand('netstat -tunlp | grep :5055');
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
restore();
