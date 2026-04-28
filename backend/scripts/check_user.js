const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://m2m-mongodb-test:27017/universal_game_core_docker?replicaSet=rs0');
    
    const email = 'smmmonirhasan92@gmail.com';
    const user = await mongoose.connection.collection('users').findOne(
        { email },
        { projection: { _id: 1, email: 1, fullName: 1, createdAt: 1 } }
    );
    
    if (user) {
        console.log('FOUND DUPLICATE USER:', JSON.stringify(user, null, 2));
        console.log('\nDeleting duplicate entry...');
        await mongoose.connection.collection('users').deleteOne({ email });
        console.log('DELETED. User can now re-register freshly.');
    } else {
        console.log('No user found with that email. Listing all users:');
        const all = await mongoose.connection.collection('users').find({}, { projection: { email: 1, fullName: 1, createdAt: 1 } }).toArray();
        console.log(JSON.stringify(all, null, 2));
    }
    
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
