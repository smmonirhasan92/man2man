const fs = require('fs');

const path = '/var/www/man2man/backend/modules/wallet/transaction.controller.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /await Transaction\.updateMany\(\s*\{\s*status:\s*\{\s*\$in:\s*\['pending',\s*'pending_instructions',\s*'awaiting_payment'\]\s*\},[^}]*\},[^}]*\{ status:\s*'expired'\s*\}\s*\);/g;

const newCode = `await Transaction.updateMany(
            { 
                status: { $in: ['pending', 'pending_instructions', 'awaiting_payment'] }, 
                createdAt: { $lt: twentyMinsAgo },
                type: { $nin: ['cash_out', 'withdraw', 'mobile_recharge', 'agent_withdraw', 'fee', 'send_money'] }
            },
            { status: 'expired' }
        );`;

if (regex.test(content)) {
    content = content.replace(regex, newCode);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched transaction.controller.js');
} else {
    console.log('Could not find the target regex block to replace.');
}
