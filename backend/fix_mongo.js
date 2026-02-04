const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27018/admin?directConnection=true';

const fixMongo = async () => {
    try {
        console.log('Connecting to Admin DB...');
        const conn = await mongoose.connect(uri, { family: 4 });
        const admin = conn.connection.db.admin();

        console.log('Checking RS Status...');
        try {
            const status = await admin.command({ replSetGetStatus: 1 });
            console.log('Current State:', status.myState); // 1 = PRIMARY, 2 = SECONDARY

            if (status.myState === 1) {
                console.log('✅ Already PRIMARY!');
                process.exit(0);
            }

            console.log('Attempting reconfig...');
            const config = await admin.command({ replSetGetConfig: 1 });
            console.log('Current Config:', JSON.stringify(config.config));

            const newConfig = config.config;
            // Force this node to be the only one
            newConfig.members = [{ _id: 0, host: "127.0.0.1:27018" }];

            // Increment version
            newConfig.version++;

            await admin.command({ replSetReconfig: newConfig, force: true });
            console.log('✅ Reconfig command sent!');

        } catch (err) {
            console.log('Error getting status/config:', err.message);
            // If not initialized, try initiate
            if (err.message.includes('not initialized') || err.message.includes('No replica set member')) {
                console.log('Initiating Replica Set...');
                await admin.command({
                    replSetInitiate: {
                        _id: "rs0",
                        members: [{ _id: 0, host: "127.0.0.1:27018" }]
                    }
                });
                console.log('✅ Initiated!');
            }
        }

        setTimeout(() => {
            console.log('Exiting...');
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

fixMongo();
