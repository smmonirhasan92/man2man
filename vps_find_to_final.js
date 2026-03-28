const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findToFinal() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- FINAL SEARCH FOR \"to\" DECLARATIONS ---');
        const searchTerms = ['let to', 'const to', 'var to', 'to ='];
        for (const term of searchTerms) {
            console.log(`Searching for: "${term}"`);
            const res = await ssh.execCommand(`grep -r "${term}" /var/www/man2man/backend --exclude-dir=node_modules --exclude-dir=.git`);
            if (res.stdout) console.log(res.stdout);
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
findToFinal();
