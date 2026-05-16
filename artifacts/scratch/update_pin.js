const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1').then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({
        nxsAccountId: String,
        transactionPin: {type: String, select: true}
    }, {strict: false}));
    
    const u = await User.findOne({nxsAccountId: 'NXS-1918-84'});
    if(!u) {
        console.log('User not found');
        process.exit();
    }
    
    console.log('Current PIN hash in DB:', u.transactionPin);
    
    // Hash the new pin 212321
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash('212321', salt);
    
    u.transactionPin = newHash;
    await u.save();
    
    console.log('PIN updated to 212321 (hashed) successfully!');
    process.exit();
});
