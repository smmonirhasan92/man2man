const { User } = require('../models');

async function checkUser() {
    try {
        const phone = '01985010101';
        console.log(`Checking for user with phone: ${phone}`);
        const user = await User.findOne({ where: { phone } });

        if (user) {
            console.log('User Found:');
            console.log(JSON.stringify(user.toJSON(), null, 2));
        } else {
            console.log('User NOT Found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUser();
