const mongoose = require('mongoose');
const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');

// Colors
const CLR = {
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    CYAN: '\x1b[36m',
    RESET: '\x1b[0m'
};

async function runReconciliation() {
    try {
        await connectDB();

        console.log(`${CLR.CYAN}=== P2P TRANSACTION LEDGER RECONCILIATION ===${CLR.RESET}\n`);

        // 1. Fetch "Pending" Cash-In Requests (Mocked Query)
        // In real system: Transaction.find({ type: 'CASH_IN', status: 'PENDING' })
        const pendingCashIns = [
            { id: 'TX_IN_001', user: 'Agent_Alpha', amount: 5000, method: 'bkash' },
            { id: 'TX_IN_002', user: 'Agent_Beta', amount: 10000, method: 'nagad' },
            { id: 'TX_IN_003', user: 'User_Gamer1', amount: 2000, method: 'bkash' }
        ];

        // 2. Fetch "Pending" Cash-Out Requests (Mocked Query)
        // In real system: Transaction.find({ type: 'CASH_OUT', status: 'PENDING' })
        const pendingCashOuts = [
            { id: 'TX_OUT_101', user: 'User_Winner1', amount: 4800, method: 'bkash' },
            { id: 'TX_OUT_102', user: 'User_Whale', amount: 9500, method: 'nagad' },
            { id: 'TX_OUT_103', user: 'Agent_Payout', amount: 2500, method: 'rocket' }
        ];

        console.log(`${CLR.YELLOW}[?] Found ${pendingCashIns.length} Cash-Ins and ${pendingCashOuts.length} Cash-Outs pending.${CLR.RESET}`);

        // 3. Match Logic (Greedy Match by Amount & Method)
        const matches = [];
        const unmatchedIn = [...pendingCashIns];
        const unmatchedOut = [...pendingCashOuts];

        for (let i = 0; i < unmatchedIn.length; i++) {
            const cin = unmatchedIn[i];

            // Find best Cash-Out match (Same Method, Similar Amount)
            // Tolerance +/- 500 BDT
            const matchIndex = unmatchedOut.findIndex(cout =>
                cout.method === cin.method &&
                Math.abs(cout.amount - cin.amount) <= 500
            );

            if (matchIndex !== -1) {
                const cout = unmatchedOut[matchIndex];
                matches.push({
                    in: cin,
                    out: cout,
                    diff: cin.amount - cout.amount
                });
                // Remove from pool
                unmatchedOut.splice(matchIndex, 1);
                unmatchedIn.splice(i, 1);
                i--; // Adjust index
            }
        }

        // 4. Output Ledger
        console.log(`\n${CLR.GREEN}[MATCHED TRANSACTIONS]${CLR.RESET}`);
        console.table(matches.map(m => ({
            'Cash-In User': m.in.user,
            'Cash-Out User': m.out.user,
            'Method': m.in.method,
            'In Amount': m.in.amount,
            'Out Amount': m.out.amount,
            'Net Diff': m.diff
        })));

        console.log(`\n${CLR.YELLOW}[UNMATCHED]${CLR.RESET}`);
        if (unmatchedIn.length > 0) {
            console.log('Cash-Ins Waiting:');
            console.table(unmatchedIn);
        } else {
            console.log('No unmatched Cash-Ins.');
        }

        if (unmatchedOut.length > 0) {
            console.log('Cash-Outs Waiting:');
            console.table(unmatchedOut);
        } else {
            console.log('No unmatched Cash-Outs.');
        }

        console.log(`\n${CLR.CYAN}[ACTION REQUIRED] Approve Matched Batch #${Date.now()}${CLR.RESET}`);
        process.exit(0);

    } catch (err) {
        console.error('Reconciliation Failed:', err);
        process.exit(1);
    }
}

runReconciliation();
