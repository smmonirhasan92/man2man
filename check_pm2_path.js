const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function getPM2Path() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        const res = await ssh.execCommand('pm2 jlist');
        const processes = JSON.parse(res.stdout);
        processes.forEach(p => {
            console.log(`App: ${p.name}, Path: ${p.pm2_env.pm_cwd}, Script: ${p.pm2_env.pm_exec_path}`);
        });
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
getPM2Path();
