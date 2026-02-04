const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        const users = await User.find({});
        console.log(`\nFound ${users.length} Users:`);

        users.forEach(u => {
            console.log(`\nID: ${u._id}`);
            console.log(`Username: '${u.username}'`);
            console.log(`Full Name: '${u.fullName}'`);
            console.log(`Phone: '${u.primary_phone}'`);
            console.log(`Legacy Main: ${u.main_balance}`);
            console.log(`Wallet Main: ${u.wallet ? u.wallet.main : 'N/A'}`);
            console.log(`Wallet Income: ${u.wallet ? u.wallet.income : 'N/A'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
