const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
    
    const inlineScript = `
require('dotenv').config({ path: '/var/www/man2man/backend/.env' });
const mongoose = require('mongoose');
const User = require('/var/www/man2man/backend/modules/user/UserModel');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const userId = "69b1257e37de0366f5e48916"; // Extracted from logs
        const user = await User.findById(userId);
        console.log("Raw user wallet from DB:", user ? JSON.stringify(user.wallet) : "NOT FOUND");
        
        const testQuery = await User.findOne({ _id: userId, 'wallet.main': { $gte: 1 } });
        console.log("Query GTE 1 match:", testQuery ? "MATCHED" : "NO MATCH");
        
        // Let's manually deduct 1 NXS to see if it allows it
        const updated = await User.findOneAndUpdate(
            { _id: userId, 'wallet.main': { $gte: 1 } },
            { $inc: { 'wallet.main': -1 } },
            { new: true }
        );
        console.log("Updated Wallet:", updated ? JSON.stringify(updated.wallet) : "FAILED UPDATE");

    } catch (err) {
        console.error("Test Error:", err);
    }
    process.exit();
}
test();
    `;
    
    await ssh.execCommand(`echo "${inlineScript.replace(/"/g, '\\"')}" > /var/www/man2man/backend/test_spin.js`);
    const r = await ssh.execCommand('node test_spin.js', { cwd: '/var/www/man2man/backend' });
    
    console.log("OUT:", r.stdout);
    console.error("ERR:", r.stderr);
    ssh.dispose();
}
run();
