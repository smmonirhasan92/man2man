const CURRENCY = require('../config/currency');

console.log("--- Currency Normalization Audit ---");
console.log(`- NXS Value: $${CURRENCY.NXS_TO_USD} (Ex: 100 NX = $${100 * CURRENCY.NXS_TO_USD})`);
console.log(`- BDT Rate: ৳${CURRENCY.USD_TO_BDT} per $1`);
console.log(`- NXS to BDT: ৳${(CURRENCY.NXS_TO_USD * CURRENCY.USD_TO_BDT).toFixed(4)} per 1 NX`);
console.log(`- Transfer Minimum: ${CURRENCY.TRANSFER_MINIMUM_NXS} NX ($${CURRENCY.TRANSFER_MINIMUM_NXS * CURRENCY.NXS_TO_USD})`);

console.log("\n--- Comparison Table (USA vs BDT) ---");
const examples = [10, 50, 100, 260, 520, 1000];
console.log("NX Amount | USD Value | BDT Value");
console.log("---------------------------------");
examples.forEach(n => {
    const usd = (n * CURRENCY.NXS_TO_USD).toFixed(2);
    const bdt = Math.round(n * CURRENCY.NXS_TO_USD * CURRENCY.USD_TO_BDT);
    console.log(`${n.toString().padEnd(9)} | $${usd.padEnd(8)} | ৳${bdt}`);
});

if (CURRENCY.NXS_TO_USD === 0.01 && CURRENCY.TRANSFER_MINIMUM_NXS === 500) {
    console.log("\n✅ MATH VERIFIED: System is now Cent-Normalized.");
} else {
    console.log("\n❌ MATH ERROR: Rates do not match target normalization.");
}
