const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function sysCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- CPU Features ---");
        const cpu = await ssh.execCommand('grep -E "avx|avx2|sse4_2" /proc/cpuinfo | head -n 1');
        console.log(cpu.stdout.trim() || "No advanced features found!");

        console.log("--- LDD Check on node-llama-cpp binary ---");
        const findNode = await ssh.execCommand('find node_modules/node-llama-cpp -name "*.node"', { cwd: '/var/www/man2man/backend' });
        console.log("Binaries found:\n", findNode.stdout);

        const firstBin = findNode.stdout.split('\n').filter(l => l.trim()).shift();
        if (firstBin) {
            console.log("Checking:", firstBin);
            const ldd = await ssh.execCommand('ldd ' + firstBin, { cwd: '/var/www/man2man/backend' });
            console.log("LDD Output:\n", ldd.stdout);
        } else {
            console.log("No .node binary found in node-llama-cpp");
        }

    } catch (e) {
        console.error("SSH Error:", e);
    } finally {
        ssh.dispose();
    }
}

sysCheck();
