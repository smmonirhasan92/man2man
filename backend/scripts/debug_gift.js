const mongoose = require('mongoose');
const { openGiftBox } = require('../modules/gamification/GiftBoxController');
const User = require('../modules/user/UserModel');

mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1').then(async () => {
    try {
        const user = await User.findOne({ phone: '01711111111' });
        if (!user) {
           console.log("No test user found, creating fake id");
           user = { _id: new mongoose.Types.ObjectId() };
        }
        const req = { body: { tier: 'free' }, user: { user: { id: user._id } } };
        const res = { 
            json: (data) => { console.log('JSON Output:', data); },
            status: (code) => ({ json: (err) => console.error('Status Error:', code, err) })
        };
        await openGiftBox(req, res);
    } catch (err) {
        console.error('Unhandled err', err);
    } finally {
        mongoose.disconnect();
    }
});
