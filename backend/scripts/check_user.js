const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');

async function check() {
    try {
        await mongoose.connect('mongodb://m2m-mongodb:27017/man2man');
        const phoneToCheck = '017212321';
        const user = await User.findOne({
            $or: [
                { primary_phone: phoneToCheck },
                { primary_phone: phoneToCheck.replace(/^0/, '') },
                { primary_phone: '+88' + phoneToCheck },
                { username: phoneToCheck }
            ]
        });
        
        if (user) {
            console.log('--- USER FOUND ---');
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Phone:', user.primary_phone);
            console.log('Status:', user.status);
        } else {
            console.log('--- USER NOT FOUND ---');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
