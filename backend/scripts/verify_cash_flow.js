const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyCashFlow() {
    try {
        console.log('🔄 Starting Cash Flow Verification...');

        // 1. User Login
        console.log('👤 Logging in User (01701010101)...');
        const userRes = await axios.post(`${API_URL}/auth/login`, {
            phone: '01701010101',
            password: 'WRONG_PASSWORD' // Should fail if not handled, but we use correct if needed. Wait, user password IS '123456'.
            // Demo user was created with '123456'. Let's use that.
        });
        // Login failure expected with WRONG_PW unless User has master key (Only Super Admin does).
        // Let's retry with correct password.
    } catch (err) {
        // expected
    }

    try {
        const userRes = await axios.post(`${API_URL}/auth/login`, {
            phone: '01701010101',
            password: '123456'
        });
        const userToken = userRes.data.token;
        const userId = userRes.data.user.id;
        console.log(`✅ User Logged In. ID: ${userId}`);

        // 2. Request Cash In (Deposit)
        // Usually via 'transaction/deposit'? Or 'transaction/request'? No, transaction controller handles 'add_money'?
        // Looking at transactionController.js, there isn't a direct "request deposit" endpoint shown clearly, 
        // but let's assume standard flow (POST /transaction/request or similar).
        // Wait, I need to check routes.
        // Let's assume there's a route for user to request deposit. 
        // Standard in this system might be 'wallet/deposit' or similar. 
        // Using Generic Transaction Create if available?
        // Let's try creating a "cash_in" transaction directly if exposed, or check 'walletRoutes'.

        // Actually, let's create a pending transaction directly via API if possible.
        // If not, we might need to use a specific route.
        // Let's assume POST /api/transactions/deposit exists or similar.
        // Checking codebase showed 'transactionRoutes'.

        // Let's TRY generic 'request' route if I recall `transactionRoutes`.
        // If not, I'll simulate by calling the controller logic or route I found.
        // Found `withdrawalRoutes` but not explicit `depositRoutes`.
        // Many systems like this use `POST /api/wallet/deposit` or similar.

        // 2. Request Cash In (Deposit)
        // Route identified: POST /api/wallet/recharge
        console.log('💰 Requesting Deposit (500 BDT) via /wallet/recharge...');

        // Note: Route uses multer (multipart). Trying JSON first.
        // If server allows JSON body (handled by express.json before multer or if multer ignores non-multipart), this works.
        // Otherwise we need FormData.

        let depositRes;
        try {
            depositRes = await axios.post(`${API_URL}/wallet/recharge`, {
                amount: 500,
                method: 'bkash',
                transactionId: 'TRX_' + Date.now(), // User provided TRX ID
                recipientDetails: '01799999999'
            }, {
                headers: { 'x-auth-token': userToken }
            });
            console.log('✅ Deposit Requested via /wallet/recharge');

        } catch (e) {
            console.log('⚠️ /wallet/recharge JSON failed (likely multer expectation). Error:', e.message);
            // If this fails, we might need a workaround or try /transactions/create if enabled without upload
            throw e;
        }

        const trxId = depositRes.data.transaction ? depositRes.data.transaction._id : depositRes.data._id;
        console.log('📝 Transaction Created DB ID:', trxId);

        // 3. Admin Login (Master Key)
        console.log('👮 Logging in Super Admin (01700000000)...');
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            phone: '01700000000',
            password: 'ANY'
        });
        const adminToken = adminRes.data.token;
        console.log('✅ Admin Logged In.');

        // 4. Approve Transaction
        console.log(`✅ Approving TRX ${trxId}...`);
        // Route: POST /api/transactions/process usually? or /complete
        // Checked controller: exports.completeTransaction
        // Route likely: /api/transactions/complete or /process
        // I will try /complete
        await axios.post(`${API_URL}/transactions/complete`, {
            transactionId: trxId,
            status: 'completed',
            comment: 'Auto-Approved by Verify Script'
        }, {
            headers: { 'x-auth-token': adminToken }
        });
        console.log('✅ Transaction Approved.');

        // 5. Verify User Balance
        console.log('🔍 Verifying User Balance...');
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { 'x-auth-token': userToken }
        });

        console.log(`💰 User Balance: ${meRes.data.wallet_balance} (Expected +500)`);

        if (meRes.data.wallet_balance >= 1000) { // Started with 500
            console.log('🎉 SUCCESS: Cash In Flow Verified!');
        } else {
            console.log('❌ FAILURE: Balance did not update correctly.');
        }

    } catch (err) {
        console.error('❌ Verification Failed:', err.response ? err.response.data : err.message);
        // Assuming the error might be 404 for route, I will need to check routes.
    }
}

// Quick Route Checker Helper
// I need valid routes. 
// Let's assume standard /wallet/deposit based on common patterns in this codebase.
verifyCashFlow();
