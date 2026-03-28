const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function atomicDeploy() {
    try {
        console.log('Connecting to VPS for ATOMIC SWAP (Target: man2man)...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const rootDir = '/var/www/man2man';
        const buildDir = '/var/www/man2man_build';
        
        // --- Phase 1: Shadow Build Preparation ---
        console.log('\n--- Phase 1: Shadow Build Preparation ---');
        const prepCommands = [
            `rm -rf ${buildDir}`,
            `cp -r ${rootDir} ${buildDir}`,
            `cd ${buildDir} && git fetch --all && git reset --hard origin/feat/p2p-v3-stable`
        ];
        for (const cmd of prepCommands) {
            console.log(`> Executing: ${cmd}`);
            await ssh.execCommand(cmd);
        }

        // --- Phase 2: Isolated Build ---
        console.log('\n--- Phase 2: Isolated Build (Next.js) ---');
        console.log('This may take 2-4 minutes. Live site is still untouched...');
        const buildCmd = `cd ${buildDir}/frontend && npm install && npm run build`;
        const buildResult = await ssh.execCommand(buildCmd);
        if (buildResult.stdout) console.log(buildResult.stdout);
        if (buildResult.stderr) console.error(buildResult.stderr);

        // --- Phase 3: The Atomic Swap ---
        console.log('\n--- Phase 3: THE ATOMIC SWAP ---');
        const swapCommands = [
            `rm -rf ${rootDir}_old`,
            `mv ${rootDir} ${rootDir}_old`,
            `mv ${buildDir} ${rootDir}`
        ];
        for (const cmd of swapCommands) {
            console.log(`> Executing: ${cmd}`);
            await ssh.execCommand(cmd);
        }

        // --- Phase 4: Zombie Cleanup & Restart ---
        console.log('\n--- Phase 4: Zombie Cleanup & Restart ---');
        const cleanupCommands = [
            `fuser -k 3000/tcp || true`,
            `pm2 restart all || (pm2 start npm --name "frontend" -- start)`
        ];
        for (const cmd of cleanupCommands) {
            console.log(`> Executing: ${cmd}`);
            await ssh.execCommand(cmd);
        }

        console.log('\nATOMIC Deployment V3.0 completed successfully.');
        ssh.dispose();
    } catch (err) {
        console.error('Atomic Deployment Failed:', err);
        ssh.dispose();
    }
}
atomicDeploy();
