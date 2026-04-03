const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepAiCheck() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Check Backend package.json ---");
        const pkg = await ssh.execCommand('cat package.json', { cwd: '/var/www/man2man/backend' });
        console.log(pkg.stdout);

        console.log("--- Check Models Dir ---");
        const modelsLs = await ssh.execCommand('ls -la /var/www/man2man/backend/models');
        console.log(modelsLs.stdout);

        console.log("--- PM2 Detailed Logs ---");
        // We grep for AI-related messages
        const aiLogs = await ssh.execCommand('pm2 logs man2man-backend --lines 200 --nostream --no-colors | grep "\[AI\]"');
        console.log(aiLogs.stdout || "No [AI] tags found in logs.");

        console.log("--- Test dynamic import via Node CLI ---");
        // This will tell us if the library is loadable
        const importTest = await ssh.execCommand('node -e "import(\'node-llama-cpp\').then(m => console.log(\'SUCCESS\')).catch(e => console.error(e))"', { cwd: '/var/www/man2man/backend' });
        console.log("Import Test STDOUT:", importTest.stdout);
        console.log("Import Test STDERR:", importTest.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
deepAiCheck();
