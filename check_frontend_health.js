const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFrontendHealth() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Frontend Directory Details ---");
        const ls = await ssh.execCommand('ls -la', { cwd: '/var/www/man2man/frontend' });
        console.log(ls.stdout);

        console.log("--- Frontend package.json (scripts) ---");
        const pkg = await ssh.execCommand('cat package.json', { cwd: '/var/www/man2man/frontend' });
        console.log(pkg.stdout ? JSON.parse(pkg.stdout).scripts : "No package.json");

        console.log("--- Checking for .next folder ---");
        const next = await ssh.execCommand('ls -d .next', { cwd: '/var/www/man2man/frontend' });
        console.log(next.stdout || "MISSING .next FOLDER - REBUILD NEEDED");

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkFrontendHealth();
