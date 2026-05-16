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
    console.log('Hash in DB:', u.transactionPin);
    
    const res = await bcrypt.compare('212321', u.transactionPin || '');
    console.log('Is 212321 valid?:', res);
    
    // Check if another PIN is valid? Let's just output it
    process.exit();
});
