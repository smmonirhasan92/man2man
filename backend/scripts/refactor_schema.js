const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..'); // d:\man2man\backend
const SKIP_DIRS = ['node_modules', '.git', 'logs', 'uploads'];
const EXTENSIONS = ['.js'];

const REPLACEMENTS = [
    // Wallet Flattening
    { from: /user\.wallet\.main/g, to: 'user.main_balance' },
    { from: /user\.wallet\.game/g, to: 'user.game_balance' },
    { from: /user\.wallet\.income/g, to: 'user.income_balance' },
    { from: /user\.wallet\.purchase/g, to: 'user.purchase_balance' },
    { from: /user\.wallet\.agent/g, to: 'user.agent_balance' },
    { from: /user\.wallet\.pending_referral/g, to: 'user.pending_referral_balance' },

    // Phone Renaming
    { from: /user\.phone/g, to: 'user.primary_phone' },
    { from: /req\.body\.phone/g, to: 'req.body.primary_phone' }, // Backend expects this now
    { from: /\.findOne\(\{ phone:/g, to: '.findOne({ primary_phone:' },
    { from: /synthetic_phone/g, to: 'synthetic_phone' },

    // Schema Definitions (naive match, will likely need manual fix in UserModel but this helps)
    { from: /main: \{ type: Number/g, to: 'main_balance: { type: Number' },
    // { from: /phone: \{ type: String/g, to: 'primary_phone: { type: String' }, // Risky, handled manually
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (SKIP_DIRS.includes(file)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (EXTENSIONS.includes(path.extname(file))) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    REPLACEMENTS.forEach(rule => {
        content = content.replace(rule.from, rule.to);
    });

    if (content !== original) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

console.log("Starting Refactor...");
walk(ROOT_DIR);
console.log("Refactor Complete.");
