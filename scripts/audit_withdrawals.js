const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

const SSH = (cmd) => execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, { cwd: root, encoding: 'utf8' });

const deployScript = (localPath, remotePath, content) => {
    fs.writeFileSync(localPath, content, 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    SSH(`> /tmp/s_b64.txt`);
    for (let i = 0; i < b64.length; i += 4000) SSH(`echo -n '${b64.substring(i, i+4000)}' >> /tmp/s_b64.txt`);
    SSH(`base64 -d /tmp/s_b64.txt > ${remotePath}`);
};

const mongoScript = `
var results = db.transactions.find({
  amount: {$lt: -1000}
}).sort({amount:1}).limit(20).toArray();
results.forEach(function(t){
  print(t.type + " | amount: " + t.amount + " | status: " + t.status + " | date: " + t.createdAt + " | desc: " + t.description);
});
print("Total suspicious count: " + db.transactions.count({amount:{$lt:-1000}}));
`;

deployScript(path.join(root, 'scripts', '_tmp_mongo.js'), '/tmp/mongo_audit2.js', mongoScript);
const result = SSH(`mongosh universal_game_core_v1 --quiet /tmp/mongo_audit2.js`);
console.log('=== SUSPICIOUS TRANSACTIONS (amount < -1000) ===');
console.log(result);
