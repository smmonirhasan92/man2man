const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPm2() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- PM2 List ---');
        const res = await ssh.execCommand('pm2 list');
        console.log(res.stdout);

        console.log('--- Searching for PM2 Working Directories ---');
        const res2 = await ssh.execCommand('pm2 jlist | jq ".[] | {name: .name, cwd: .pm2_env.cwd}"');
        console.log(res2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkPm2();
