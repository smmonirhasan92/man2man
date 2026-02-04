const rates = [2.0, 1.0, 1.0, 0.5, 0.5];
const planAmount = 1000; // Example plan cost
const taskReward = 0.50; // Example task reward

console.log("--- Referral Logic Audit ---");
console.log(`Plan Amount: ${planAmount}`);
console.log(`Rates: ${rates.join('%, ')}%`);

let totalPlanDistributed = 0;
rates.forEach((rate, i) => {
    const rawComm = (planAmount * rate) / 100;
    // Current Logic (No rounding in service file, relies on DB storage)
    console.log(`L${i + 1} (${rate}%): ${rawComm}`);
    totalPlanDistributed += rawComm;
});
console.log(`Total Distributed (Plan): ${totalPlanDistributed} (${(totalPlanDistributed / planAmount) * 100}%)`);

console.log("\n--- Task Reward Logic Audit ---");
console.log(`Task Reward Amount: ${taskReward}`);
let totalTaskDistributed = 0;
rates.forEach((rate, i) => {
    const rawComm = (taskReward * rate) / 100;
    // Check for tiny fractions
    console.log(`L${i + 1} (${rate}%): ${rawComm.toFixed(10)} (Raw)`);
    totalTaskDistributed += rawComm;
});
console.log(`Total Distributed (Task): ${totalTaskDistributed}`);

// Validation
if (totalPlanDistributed !== planAmount * 0.05) {
    console.error("❌ Plan Commission Total Mismatch (Float Error)");
} else {
    console.log("✅ Plan Commission Logic OK");
}
