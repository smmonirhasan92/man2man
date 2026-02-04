const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function fixUser() {
    try {
        const phone = '01985010101';
        console.log(`Fixing user with phone: ${phone}`);
        const user = await User.findOne({ where: { phone } });

        if (user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            user.password = hashedPassword;
            user.role = 'super_admin'; // Granting highest privileges
            user.kycStatus = 'verified';

            await user.save();
            console.log('User updated successfully:');
            console.log('- Password reset to: 123456');
            console.log('- Role updated to: super_admin');
            console.log('- KYC Status: verified');
        } else {
            console.log('User NOT Found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

fixUser();
