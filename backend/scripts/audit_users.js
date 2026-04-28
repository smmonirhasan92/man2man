const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://m2m-mongodb-test:27017/universal_game_core_docker?replicaSet=rs0');
    
    // Check all users - see their fields
    const all = await mongoose.connection.collection('users').find({}, { 
        projection: { 
            _id: 1, 
            email: 1, 
            fullName: 1, 
            primary_phone: 1,
            password: 1,
            emailVerified: 1,
            role: 1,
            createdAt: 1 
        } 
    }).toArray();
    
    console.log('=== ALL USERS AUDIT ===');
    all.forEach((u, i) => {
        const hasPassword = !!u.password;
        const hasEmail = !!u.email;
        const hasPhone = !!u.primary_phone;
        const isBcrypt = hasPassword && u.password.startsWith('$2');
        console.log(`[${i+1}] ${u.fullName || 'NO NAME'}`);
        console.log(`    email: ${u.email || 'NONE'}`);
        console.log(`    phone: ${u.primary_phone || 'NONE'}`);
        console.log(`    password: ${hasPassword ? (isBcrypt ? 'bcrypt ✅' : 'plain/other ⚠️') : 'MISSING ❌'}`);
        console.log(`    emailVerified: ${u.emailVerified}`);
        console.log(`    role: ${u.role}`);
        console.log('');
    });
    
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
