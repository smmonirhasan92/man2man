const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function updateAdmin() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // Load UserModel using a flexible schema for this standalone script
        const User = mongoose.connection.collection('users');

        const oldIdentifier = '01712345678';
        const newPhone = '01997161924';
        const newPasswordRaw = '161924';

        console.log(`Looking for super admin with identifier: ${oldIdentifier}`);
        const user = await User.findOne({
            $or: [
                { primary_phone: oldIdentifier },
                { username: oldIdentifier }
            ],
            role: 'super_admin'
        });

        if (!user) {
            console.log('Super admin account not found with the given identifier.');
            // Let's just find any super_admin
            const anySuperAdmin = await User.findOne({ role: 'super_admin' });
            if (anySuperAdmin) {
                console.log(`Found a super_admin but identifier is different. Username: ${anySuperAdmin.username}, Phone: ${anySuperAdmin.primary_phone}`);
                console.log('Updating this super_admin anyway...');
                
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

                await User.updateOne({ _id: anySuperAdmin._id }, {
                    $set: {
                        primary_phone: newPhone,
                        username: newPhone, // Often username is set to phone
                        password: hashedPassword
                    }
                });
                console.log('Super admin updated successfully.');
            } else {
                console.log('No super_admin found in the database at all.');
            }
        } else {
            console.log(`Found user: ${user._id}`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

            await User.updateOne({ _id: user._id }, {
                $set: {
                    primary_phone: newPhone,
                    username: newPhone,
                    password: hashedPassword
                }
            });

            console.log('Super admin updated successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updateAdmin();
