const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkAndApplySwap() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        console.log('✅ Connected.');

        const freeResult = await ssh.execCommand('free -h');
        console.log('--- Current RAM/Swap ---');
        console.log(freeResult.stdout);

        if (freeResult.stdout.includes('Swap:            0B')) {
            console.log('\n⚠️ No Swap detected. Creating 2GB Swap file for build stability...');
            const swapCmds = [
                'fallocate -l 2G /swapfile',
                'chmod 600 /swapfile',
                'mkswap /swapfile',
                'swapon /swapfile',
                'echo "/swapfile none swap sw 0 0" | tee -a /etc/fstab'
            ];
            for (const cmd of swapCmds) {
                console.log(`Executing: ${cmd}`);
                await ssh.execCommand(cmd);
            }
            console.log('✅ Swap created.');
        } else {
            console.log('\n✅ Swap already exists.');
        }

        ssh.dispose();
    } catch (err) {
        console.error('❌ Error:', err);
        ssh.dispose();
    }
}

checkAndApplySwap();
