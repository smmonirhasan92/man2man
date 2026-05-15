const { MongoClient } = require('mongodb');

async function convertAgentsToUsers() {
    const uri = 'mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0';
    const client = new MongoClient(uri, { directConnection: true });

    try {
        await client.connect();
        const db = client.db('universal_game_core_v1');

        // Count agents before
        const agentsBefore = await db.collection('users').countDocuments({ role: 'agent' });
        console.log(`Agents found BEFORE: ${agentsBefore}`);

        // Convert all 'agent' roles to 'user'
        const result = await db.collection('users').updateMany(
            { role: 'agent' },
            { $set: { role: 'user' } }
        );
        console.log(`Converted ${result.modifiedCount} agents to users.`);

        // Verify
        const agentsAfter = await db.collection('users').countDocuments({ role: 'agent' });
        const usersAfter = await db.collection('users').countDocuments({ role: 'user' });
        const adminsAfter = await db.collection('users').countDocuments({ role: { $in: ['admin', 'super_admin'] } });

        console.log('\n=== ROLE BREAKDOWN AFTER CONVERSION ===');
        console.log(`Remaining Agents: ${agentsAfter}`);
        console.log(`Total Users: ${usersAfter}`);
        console.log(`Total Admins: ${adminsAfter}`);
        console.log('Done!');

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

convertAgentsToUsers();
