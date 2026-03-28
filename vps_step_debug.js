const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function stepDebug() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Inserting Debug Logs on VPS...');
        const injectScript = `
const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const modified = content.replace('await connectDB();', 'console.log("[DEBUG] Connecting to DB..."); await connectDB(); console.log("[DEBUG] DB Connected.");')
                        .replace('initPulse();', 'console.log("[DEBUG] Initializing Pulse..."); initPulse(); console.log("[DEBUG] Pulse Initialized.");')
                        .replace('await StakingService.seedDefaultPools();', 'console.log("[DEBUG] Seeding Staking Pools..."); await StakingService.seedDefaultPools(); console.log("[DEBUG] Pools Seeded.");')
                        .replace('server.listen', 'console.log("[DEBUG] Calling server.listen..."); server.listen');
fs.writeFileSync('server.js.debug', modified);
`;
        await ssh.execCommand(`node -e "${injectScript.replace(/"/g, '\\"')}"`, { cwd: '/var/www/man2man/backend' });
        
        console.log('Running debug version...');
        const res = await ssh.execCommand('timeout 20s node server.js.debug', { cwd: '/var/www/man2man/backend' });
        console.log(res.stdout);
        console.log(res.stderr);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
stepDebug();
