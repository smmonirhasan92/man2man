const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    const file = '/var/www/man2man/backend/controllers/adminController.js';

    // Use Python to fix the duplicate declaration precisely
    // We want to remove ONLY the second occurrence of: const totalSelfDeposit = self_deposits[0]?.total || 0;
    const pythonFix = `python3 -c "
import re
with open('${file}', 'r') as f:
    content = f.read()
    
# Find and remove the SECOND occurrence of the duplicate line
needle = 'const totalSelfDeposit = self_deposits[0]?.total || 0;'
first = content.find(needle)
second = content.find(needle, first + 1)

if second != -1:
    # Remove the second occurrence + its surrounding newline
    content = content[:second] + content[second + len(needle):]
    # Clean up any double blank lines created
    content = re.sub(r'\\n\\s*\\n\\s*\\n', '\\n\\n', content)
    with open('${file}', 'w') as f:
        f.write(content)
    print('Fixed: removed duplicate at position', second)
else:
    print('No duplicate found - already fixed?')
"`;

    console.log('Applying Python fix...');
    const result = await ssh.execCommand(pythonFix);
    console.log(result.stdout || result.stderr);

    // Verify it's gone
    console.log('\n=== Verifying (grep totalSelfDeposit) ===');
    const verify = await ssh.execCommand(`grep -n "totalSelfDeposit" ${file}`);
    console.log(verify.stdout);

    // Now find backend server entry point
    console.log('\n=== Finding backend server file ===');
    const findServer = await ssh.execCommand('find /var/www/man2man/backend -maxdepth 1 -name "*.js" | head -10');
    console.log(findServer.stdout);

    const findAlt = await ssh.execCommand('ls /var/www/man2man/backend/ | head -20');
    console.log('\n/var/www/man2man/backend/ contents:\n' + findAlt.stdout);

    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
