
// Logic extracted from AviatorService.js for verification
const crypto = require('crypto');

function generateCrashPointTest() {
    const hash = crypto.randomBytes(8).toString('hex');
    const h = parseInt(hash.slice(0, 13), 16); // 52-bit match
    const e = Math.pow(2, 52);

    let multiplier = Math.floor((100 * e - h) / (e - h)) / 100.0;
    if (multiplier < 1.00) multiplier = 1.00;

    return multiplier;
}

console.log("[TEST_FLIGHTS] Running 10 simulations...");
for (let i = 0; i < 10; i++) {
    const res = generateCrashPointTest();
    console.log(`Flight ${i + 1}: ${res.toFixed(2)}x`);
}
