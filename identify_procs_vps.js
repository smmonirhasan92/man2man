const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function identifyProcesses() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Process on 3000 ---");
        const p3000 = await ssh.execCommand('lsof -t -i :3000');
        const pid3000 = p3000.stdout.trim();
        if (pid3000) {
            const cmd = await ssh.execCommand(`ps -p ${pid3000} -o command=`);
            console.log(`PID ${pid3000}: ${cmd.stdout}`);
        } else {
            console.log("None on 3000");
        }

        console.log("--- Process on 5050 ---");
        const p5050 = await ssh.execCommand('lsof -t -i :5050');
        const pid5050 = p5050.stdout.trim();
        if (pid5050) {
            const cmd = await ssh.execCommand(`ps -p ${pid5050} -o command=`);
            console.log(`PID ${pid5050}: ${cmd.stdout}`);
        } else {
            console.log("None on 5050");
        }

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
identifyProcesses();
