const { execSync } = require('child_process');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

try {
    const patchCode = Buffer.from(`
const fs = require('fs');
let c = fs.readFileSync('/var/www/man2man/backend/modules/wallet/transaction.controller.js', 'utf8');

const oldBlock = "let amountToAdd = parseFloat(transaction.amount);\\n                    if (bonusAmount) amountToAdd += parseFloat(bonusAmount);";

const newBlock = "let amountToAdd = parseFloat(transaction.amount);\\n                    if (bonusAmount) {\\n                        const parsedBonus = parseFloat(bonusAmount);\\n                        if (parsedBonus > amountToAdd * 2) {\\n                            throw new Error('নিরাপত্তা এলার্ট: বোনাস অ্যামাউন্ট (' + parsedBonus + ') ডিপোজিটের চেয়ে অস্বাভাবিক বেশি! (Max allowed: 200%)');\\n                        }\\n                        amountToAdd += parsedBonus;\\n                    }";

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
    fs.writeFileSync('/var/www/man2man/backend/modules/wallet/transaction.controller.js', c);
    console.log('Patch Applied Successfully');
} else {
    console.log('Patch already applied or old block not found');
}
`).toString('base64');

    console.log('Uploading patch script...');
    SSH(`echo '${patchCode}' | base64 -d > /tmp/patch_tx.js`);
    
    console.log('Executing patch script...');
    const result = SSH(`node /tmp/patch_tx.js`);
    console.log(result);
    
    console.log('Restarting backend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
    
    console.log('Done!');
} catch (e) {
    console.error('Failed:', e.message);
}
