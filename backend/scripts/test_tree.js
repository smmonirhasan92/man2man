const mongoose = require('mongoose');
const ReferralService = require('../modules/referral/ReferralService');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: '../.env' });

async function testTree() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let user = await User.findOne({ username: 'admin' });
        if (!user) user = await User.findOne({});

        if (!user) {
            console.log('No user found');
            process.exit(0);
        }

        console.log(`Getting Tree for ${user.username}...`);
        const tree = await new ReferralService().getReferralTree(user._id); // Assuming class not static or checking export
        // Note: ReferralService exporting instance or class? 
        // File ends with `module.exports = ReferralService;` (Class).
        // BUT some files use `module.exports = new ReferralController()`. 
        // Let's check usage. It seems to be a Class based on usage in `new ReferralService()`.

        console.log('Tree Nodes:', tree.length);
        if (tree.length > 0) console.log('Sample Node:', tree[0]);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testTree();
