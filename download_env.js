const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function fetchEnv() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        await ssh.getFile('d:\\man2man\\remote_env.txt', '/var/www/man2man/backend/.env');
        console.log("Downloaded safely.");
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
fetchEnv();
