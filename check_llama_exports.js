const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkExports() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const script = "import * as llama from 'node-llama-cpp'; console.log('Keys:', Object.keys(llama))";
        const res = await ssh.execCommand(`node -e "${script}"`, { cwd: '/var/www/man2man/backend' });
        console.log(res.stdout);
        console.log(res.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkExports();
