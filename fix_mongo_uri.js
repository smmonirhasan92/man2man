const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixMongoConnection() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- UPDATING MONGODB URI IN .ENV ---');
        // We will append ?replicaSet=rs0&directConnection=true to force strict primary binding
        const sedCommand = "sed -i 's|MONGODB_URI=mongodb://127.0.0.1:27017/universal_game_core_v1|MONGODB_URI=mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0\\&directConnection=true|g' /var/www/man2man/backend/.env";
        await ssh.execCommand(sedCommand);

        console.log('--- RESTARTING BACKEND PM2 ---');
        await ssh.execCommand('pm2 restart man2man-backend');

        console.log('--- VERIFYING NEW CONFIG ---');
        const res = await ssh.execCommand('cat /var/www/man2man/backend/.env | grep MONGODB');
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
fixMongoConnection();
