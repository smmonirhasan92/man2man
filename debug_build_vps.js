const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkBuild() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Attempting Manual Build and Capturing Errors ---');
        const res = await ssh.execCommand('npm run build', { cwd: '/var/www/man2man/frontend' });
        
        console.log('--- STDOUT ---');
        console.log(res.stdout);
        
        console.log('--- STDERR ---');
        console.log(res.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkBuild();
