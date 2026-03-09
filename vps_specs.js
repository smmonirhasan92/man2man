const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function checkSpecs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        const mem = await ssh.execCommand('free -m');
        console.log("Memory:\n", mem.stdout);
        const cpu = await ssh.execCommand('nproc');
        console.log("CPU Cores:", cpu.stdout);
    } catch (err) { console.error(err); } finally { ssh.dispose(); }
}
checkSpecs();
