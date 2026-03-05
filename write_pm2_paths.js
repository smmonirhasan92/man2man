const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();
async function getPM2Path() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        const res = await ssh.execCommand('pm2 jlist');
        const processes = JSON.parse(res.stdout);
        fs.writeFileSync('d:\\man2man\\pm2_paths.txt', '');
        processes.forEach(p => {
            fs.appendFileSync('d:\\man2man\\pm2_paths.txt', `App: ${p.name}\nCwd: ${p.pm2_env.pm_cwd}\nExec: ${p.pm2_env.pm_exec_path}\n--\n`);
        });
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
getPM2Path();
