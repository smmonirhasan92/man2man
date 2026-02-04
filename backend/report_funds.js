const { createClient } = require('redis');

async function run() {
    // Try 127.0.0.1 which is safer on Windows
    const client = createClient({ url: 'redis://127.0.0.1:6379' });

    client.on('error', err => console.error("Redis Error:", err));

    try {
        await client.connect();

        const safetynet = await client.get('wallet:safetynet') || '0';
        const platform = await client.get('wallet:platform') || '0';
        const admin = await client.get('wallet:super_admin') || '0';

        const poolIn = await client.get('super_ace:profit:in') || '0';
        const poolOut = await client.get('super_ace:profit:out') || '0';

        console.log("--- LIVE WALLET REPORT ---");
        console.log(`SafetyNet: ${safetynet} BDT`);
        console.log(`Platform : ${platform} BDT`);
        console.log(`Admin    : ${admin} BDT`);
        console.log("--------------------------");
        console.log(`Pool IN  : ${poolIn}`);
        console.log(`Pool OUT : ${poolOut}`);
        const net = parseFloat(poolIn) - parseFloat(poolOut);
        console.log(`NET POOL : ${net}`);
        console.log("--------------------------");

    } catch (e) {
        console.error("Script Failed:", e);
    }

    process.exit();
}
run();
