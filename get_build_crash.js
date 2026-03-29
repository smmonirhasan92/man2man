const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function debugBuild() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log("Building Frontend (Fetching exact crash log)...");
        const buildRes = await ssh.execCommand('cd /var/www/man2man/frontend && export NODE_OPTIONS="--max-old-space-size=2048" && npm run build');
        
        fs.writeFileSync('build_crash.txt', "STDOUT:\n" + buildRes.stdout + "\n\nSTDERR:\n" + buildRes.stderr);
        console.log("Crash log saved locally to build_crash.txt");
        ssh.dispose();
    } catch (err) {
        console.error('Fatal:', err);
        ssh.dispose();
    }
}
debugBuild();
