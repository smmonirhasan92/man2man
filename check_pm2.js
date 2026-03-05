const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function checkPM2() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        console.log((await ssh.execCommand('pm2 list')).stdout);
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkPM2();
