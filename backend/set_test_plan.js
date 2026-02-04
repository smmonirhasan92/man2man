const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const dotenv = require('dotenv');

dotenv.config();

const setPlan = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/walet-game');

        const user = await User.findOne({ primary_phone: '01900000001' });
        if (user) {
            user.taskData = {
                accountTier: 'Test Plan',
                tasksCompletedToday: 0,
                lastTaskDate: new Date()
            };
            await user.save();
            console.log('User upgraded to Test Plan');
        } else {
            console.log('User not found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

setPlan();
