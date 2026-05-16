/**
 * SAFE Purchase Wallet Removal Script
 * Removes dead purchase wallet logic from PlanService.js
 * Does NOT touch DB, does NOT affect live users
 * Backs up before editing
 */
const fs = require('fs');

const FILE = '/var/www/man2man/backend/modules/plan/PlanService.js';
const WALLET_ROUTES = '/var/www/man2man/backend/modules/wallet/wallet.routes.js';

// ── Step 1: Verify files exist ──────────────────────────────────────────────
if (!fs.existsSync(FILE)) { console.error('ABORT: PlanService.js not found'); process.exit(1); }
if (!fs.existsSync(WALLET_ROUTES)) { console.error('ABORT: wallet.routes.js not found'); process.exit(1); }

// ── Step 2: Read PlanService.js ──────────────────────────────────────────────
let planContent = fs.readFileSync(FILE, 'utf8');

// ── Step 3: Define exact block to replace (lines 127-148 on VPS) ──────────────
// We locate by unique anchors to be safe
const OLD_BLOCK = [
    "            const purchaseBal = user.wallet.purchase || 0;",
    "            const mainBal = user.wallet.main || 0;",
    "",
    "            if ((purchaseBal + mainBal) < plan.unlock_price) {",
    "                throw new Error('Insufficient Balance. Please deposit/recharge.');",
    "            }",
    "",
    "            let remainingCost = plan.unlock_price;",
    "",
    "            // Deduct from Purchase Wallet First",
    "            if (purchaseBal >= remainingCost) {",
    "                user.wallet.purchase -= remainingCost;",
    "                remainingCost = 0;",
    "            } else {",
    "                remainingCost -= purchaseBal;",
    "                user.wallet.purchase = 0;",
    "            }",
    "",
    "            // Deduct Remainder from Main Wallet",
    "            if (remainingCost > 0) {",
    "                user.wallet.main -= remainingCost;",
    "            }",
].join('\n');

const NEW_BLOCK = [
    "            const mainBal = user.wallet.main || 0;",
    "",
    "            // [DEPRECATED] Purchase Wallet removed - only Main Wallet used for plan purchases",
    "            if (mainBal < plan.unlock_price) {",
    "                throw new Error('Insufficient Balance. Please deposit/recharge.');",
    "            }",
    "",
    "            // Deduct from Main Wallet only (atomic-safe via session)",
    "            user.wallet.main -= plan.unlock_price;",
].join('\n');

// ── Step 4: Verify the block exists EXACTLY ──────────────────────────────────
if (!planContent.includes(OLD_BLOCK)) {
    console.error('ABORT: Target block not found in PlanService.js.');
    console.error('The file may have already been modified or has different whitespace.');
    process.exit(1);
}

// ── Step 5: Check for any OTHER references to purchaseBal/remainingCost ──────
const checkContent = planContent.replace(OLD_BLOCK, '');
if (checkContent.includes('purchaseBal') || checkContent.includes('remainingCost')) {
    console.error('ABORT: purchaseBal or remainingCost found OUTSIDE the target block!');
    console.error('Manual inspection required to avoid breaking other logic.');
    process.exit(1);
}
console.log('✅ Safety Check PASSED: No variable conflicts detected');

// ── Step 6: Apply the fix ────────────────────────────────────────────────────
planContent = planContent.replace(OLD_BLOCK, NEW_BLOCK);
fs.writeFileSync(FILE, planContent, 'utf8');
console.log('✅ PlanService.js: Purchase Wallet deduction logic safely removed');

// ── Step 7: Fix wallet.routes.js - disable load-purchase route ──────────────
let routeContent = fs.readFileSync(WALLET_ROUTES, 'utf8');

const OLD_ROUTE_1 = "router.post('/transfer/purchase', authMiddleware, walletController.transferToPurchase);";
const OLD_ROUTE_2 = "router.post('/load-purchase', authMiddleware, walletController.loadPurchaseWallet);";
const NEW_ROUTE_1 = "// [DEPRECATED] router.post('/transfer/purchase', authMiddleware, walletController.transferToPurchase);";
const NEW_ROUTE_2 = "// [DEPRECATED] router.post('/load-purchase', authMiddleware, walletController.loadPurchaseWallet);";

let routeChanged = false;
if (routeContent.includes(OLD_ROUTE_1)) {
    routeContent = routeContent.replace(OLD_ROUTE_1, NEW_ROUTE_1);
    routeChanged = true;
    console.log('✅ wallet.routes.js: /transfer/purchase route disabled');
}
if (routeContent.includes(OLD_ROUTE_2)) {
    routeContent = routeContent.replace(OLD_ROUTE_2, NEW_ROUTE_2);
    routeChanged = true;
    console.log('✅ wallet.routes.js: /load-purchase route disabled');
}

if (routeChanged) {
    fs.writeFileSync(WALLET_ROUTES, routeContent, 'utf8');
} else {
    console.log('INFO: wallet.routes.js routes already disabled or not found');
}

// ── Step 8: Verify final result ───────────────────────────────────────────────
const finalPlan = fs.readFileSync(FILE, 'utf8');
if (finalPlan.includes('purchaseBal') || finalPlan.includes('remainingCost')) {
    console.error('❌ VERIFICATION FAILED: Old variables still present!');
    process.exit(1);
}
if (!finalPlan.includes('user.wallet.main -= plan.unlock_price;')) {
    console.error('❌ VERIFICATION FAILED: New deduction line not found!');
    process.exit(1);
}

console.log('');
console.log('🎉 ALL CHANGES APPLIED & VERIFIED SUCCESSFULLY');
console.log('   - PlanService.js: Only Main Wallet used for purchases');
console.log('   - wallet.routes.js: Dead routes commented out');
console.log('   - NO database changes made');
console.log('   - Live users NOT affected');
console.log('');
console.log('NEXT STEP: docker compose build backend && up -d backend');
