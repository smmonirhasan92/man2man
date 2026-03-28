const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findToExhaustive() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- EXHAUSTIVE SEARCH FOR \"to\" DECLARATIONS ---');
        const searchTerms = ['let to', 'const to', 'var to'];
        for (const term of searchTerms) {
            console.log(`Searching for: "${term}"`);
            // Use find and xargs to be more robust than single grep -r
            const cmd = `find /var/www/man2man/backend -name "*.js" -not -path "*/node_modules/*" -print0 | xargs -0 grep -l "${term}"`;
            const res = await ssh.execCommand(cmd);
            if (res.stdout) {
                console.log(`Found "${term}" in:`);
                console.log(res.stdout);
                
                // For each file found, check for duplicates
                const files = res.stdout.split('\n').filter(Boolean);
                for (const file of files) {
                    const checkCmd = `grep -c "${term}" ${file}`;
                    const countRes = await ssh.execCommand(checkCmd);
                    const count = parseInt(countRes.stdout.trim());
                    if (count > 1) {
                        console.log(`DUPLICATE FOUND IN ${file}: ${count} occurrences`);
                        const detailRes = await ssh.execCommand(`grep -n "${term}" ${file}`);
                        console.log(detailRes.stdout);
                    }
                }
            }
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
findToExhaustive();
