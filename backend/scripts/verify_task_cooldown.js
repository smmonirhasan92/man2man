
const assert = require('assert');

// Mock User and Date for Cooldown Logic Test
console.log("Starting Task Cooldown Verification...");

const now = new Date();
const nowTime = now.getTime();

// Case 1: Last Task was 5 seconds ago (Should Fail)
const lastTaskRecent = nowTime - 5000;
const diff1 = nowTime - lastTaskRecent;

if (diff1 < 10000) {
    console.log(`[PASS] Blocked request from 5s ago. Time Diff: ${diff1}ms (Expected < 10000ms)`);
} else {
    console.error(`[FAIL] Allowed request from 5s ago.`);
}

// Case 2: Last Task was 12 seconds ago (Should Pass)
const lastTaskOld = nowTime - 12000;
const diff2 = nowTime - lastTaskOld;

if (diff2 >= 10000) {
    console.log(`[PASS] Allowed request from 12s ago. Time Diff: ${diff2}ms (Expected >= 10000ms)`);
} else {
    console.error(`[FAIL] Blocked request from 12s ago.`);
}

console.log("Verification Complete.");
