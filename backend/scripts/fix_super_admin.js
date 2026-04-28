const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
    await mongoose.connect('mongodb://m2m-mongodb-test:27017/universal_game_core_docker?replicaSet=rs0');
    
    const db = mongoose.connection.collection('users');
    
    // Target: Super Admin with phone 01700000000 (no password)
    const targetPhone = '01700000000';
    const newEmail = 'smmonirhasan92@gmail.com';
    const tempPassword = 'Admin@12345'; // User should change this

    // Check if email already taken
    const emailTaken = await db.findOne({ email: newEmail });
    if (emailTaken) {
        console.log(`⚠️  Email already exists on user: ${emailTaken.fullName} (${emailTaken._id})`);
        console.log('Updating that user to Super Admin role instead...');
        // Update existing email user
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(tempPassword, salt);
        await db.updateOne(
            { email: newEmail },
            { $set: { 
                role: 'super_admin', 
                password: hashed, 
                emailVerified: true,
                primary_phone: targetPhone
            }}
        );
        const updated = await db.findOne({ email: newEmail }, { projection: { _id: 1, fullName: 1, email: 1, role: 1, primary_phone: 1 } });
        console.log('✅ Updated user:', JSON.stringify(updated, null, 2));
    } else {
        // Add email + password to existing Super Admin
        const superAdmin = await db.findOne({ primary_phone: { $in: [targetPhone, `+88${targetPhone}`] } });
        if (!superAdmin) {
            console.log('❌ Super Admin with phone', targetPhone, 'not found!');
            process.exit(1);
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(tempPassword, salt);
        
        await db.updateOne(
            { _id: superAdmin._id },
            { $set: { 
                email: newEmail, 
                password: hashed, 
                emailVerified: true 
            }}
        );
        
        const updated = await db.findOne({ _id: superAdmin._id }, { projection: { _id: 1, fullName: 1, email: 1, role: 1, primary_phone: 1 } });
        console.log('✅ Super Admin updated:', JSON.stringify(updated, null, 2));
    }
    
    console.log('\n🔑 TEMP PASSWORD:', tempPassword);
    console.log('📧 LOGIN EMAIL:', newEmail);
    console.log('📱 LOGIN PHONE:', targetPhone);
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
