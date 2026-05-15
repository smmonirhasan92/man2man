const { execSync } = require('child_process');
const path = require('path');

// Write mongo script to a temp file on VPS then run it
const mongoScript = `db.transactions.find({type:"cash_out"}).sort({createdAt:-1}).limit(5).forEach(function(t){print(JSON.stringify({id:t._id.toString(),userId:t.userId.toString(),amount:t.amount,status:t.status,desc:t.description,recipient:t.recipientDetails,date:t.createdAt}))})`;

// Upload script via SSH then execute
const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

// Write script to file on VPS
SSH(`echo '${mongoScript}' > /tmp/mongo_query.js`);

// Run it
const result = SSH(`mongosh universal_game_core_v1 --quiet /tmp/mongo_query.js`);
console.log('=== LAST 5 WITHDRAW REQUESTS ===');
console.log(result);
