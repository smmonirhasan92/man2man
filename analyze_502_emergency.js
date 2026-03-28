const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function analyzeAndFix() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- 1. CWD and App Path Check ---');
        const pm2List = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(pm2List.stdout);
        apps.forEach(app => {
            console.log(`App: ${app.name}, Status: ${app.pm2_env.status}, CWD: ${app.pm2_env.pm_cwd}`);
        });

        console.log('\n--- 2. Port 3000 Audit ---');
        const portCheck = await ssh.execCommand('lsof -i :3000');
        console.log(portCheck.stdout || 'No process on 3000');

        console.log('\n--- 3. Direct Build Check (ls -la /var/www/man2man/frontend/.next) ---');
        const buildCheck = await ssh.execCommand('ls -la /var/www/man2man/frontend/.next');
        console.log(buildCheck.stdout || 'BUILD FOLDER MISSING!');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
analyzeAndFix();
