const { client } = require('../config/redis');

async function fix() {
    try {
        await client.connect();
        console.log('Connected to Redis');

        const keys = [
            'aviator:round:bets',
            'aviator:history',
            'aviator:state',
            'aviator:start_time',
            'aviator:crash_point'
        ];

        for (const k of keys) {
            const type = await client.type(k);
            console.log(`Key ${k} is type: ${type}`);
            if (type !== 'none') {
                await client.del(k);
                console.log(`Deleted ${k}`);
            }
        }

        console.log('Done.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
