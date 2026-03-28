const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findSyntaxError() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- RECURSIVE SEARCH FOR "let to", "const to", "var to" ---');
        // Using grep -r with simple strings to avoid quoting hell
        const commands = [
            'grep -r "let to" /var/www/man2man/backend',
            'grep -r "const to" /var/www/man2man/backend',
            'grep -r "var to" /var/www/man2man/backend'
        ];

        for (const cmd of commands) {
            console.log(`RUNNING: ${cmd}`);
            const res = await ssh.execCommand(cmd);
            if (res.stdout) console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
findSyntaxError();
