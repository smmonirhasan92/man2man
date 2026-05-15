const { execSync } = require('child_process');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

// Get user details for last withdrawal (userId: 69e07ca63f0ce0640670a3ab, amount: 1342 NXS)
const mongoScript = `var u=db.users.findOne({_id:ObjectId("69e07ca63f0ce0640670a3ab")},{fullName:1,username:1,phone:1});print("User: "+JSON.stringify(u))`;
SSH(`echo '${mongoScript}' > /tmp/mongo_user.js`);
const result = SSH(`mongosh universal_game_core_v1 --quiet /tmp/mongo_user.js`);
console.log('=== LAST WITHDRAWAL USER DETAILS ===');
console.log(result);
