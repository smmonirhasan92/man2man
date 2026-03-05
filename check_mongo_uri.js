const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function checkMongoUri() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        const res = await ssh.execCommand('cat /var/www/man2man/backend/.env | grep MONGODB');
        console.log(res.stdout.replace(/(:[^@]+@)/g, ':***@')); // Hide password
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkMongoUri();
