const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1')
    .then(async () => {
        console.log('DB Connected.');
        // Since I'm running inside backend root, I'll require the actual paths:
        const ActualUser = require('./modules/user/UserModel.js');
        const ActualTransaction = require('./modules/wallet/TransactionModel.js');

        const user = await ActualUser.findOne({ fullName: /MD\. SHAHIN ALAM/i });
        if (!user) {
            console.log('User not found by name.');
            process.exit();
        }
        
        const targetUser = user;
        console.log('Found User:', targetUser.fullName, targetUser._id);

        const admin_loans = await ActualTransaction.find({ 
            userId: targetUser._id, 
            type: { $in: ['admin_credit', 'admin_adjustment', 'mint'] }, 
            status: 'completed' 
        });

        console.log('Admin Loans Transactions:', admin_loans);

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
