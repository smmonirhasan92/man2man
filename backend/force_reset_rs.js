const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27018/admin?directConnection=true';

const forceReset = async () => {
    try {
        console.log('Connecting to Admin DB...');
        const conn = await mongoose.connect(uri, { family: 4 });
        const admin = conn.connection.db.admin();

        console.log('Checking command line opts...');
        const opts = await admin.command({ getCmdLineOpts: 1 });
        console.log('ReplSet Name:', opts.parsed.replication?.replSetName || 'None');

        const rsName = opts.parsed.replication?.replSetName || 'rs0';

        const config = {
            _id: rsName,
            members: [{ _id: 0, host: '127.0.0.1:27018' }],
            version: 100 // High version to override
        };

        console.log('Forcing Reconfig...');
        try {
            await admin.command({ replSetReconfig: config, force: true });
            console.log('✅ Reconfig Success!');
        } catch (e) {
            console.error('Reconfig Failed:', e.message);

            if (e.message.includes('not initialized')) {
                console.log('Trying Initiate...');
                await admin.command({ replSetInitiate: config });
                console.log('✅ Initiate Success!');
            }
        }

        setTimeout(() => process.exit(0), 1000);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

forceReset();
