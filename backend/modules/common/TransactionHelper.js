const mongoose = require('mongoose');

/**
 * Executes a callback within a Transaction if supported.
 * If the MongoDB instance does not support transactions (Standalone), 
 * it retries the operation without a transaction.
 * 
 * @param {Function} callback - async (session) => { ... }
 */
async function runTransaction(callback) {
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        let session = null;
        try {
            console.log(`[TX_TRACE] Starting Session (Attempt ${retries + 1}/${MAX_RETRIES})...`);
            session = await mongoose.startSession();
            session.startTransaction();
            console.log(`[TX_TRACE] Session Started & Transaction Begin. ID: ${session.id}`);

            const result = await callback(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            const strError = error.toString();
            // Check for TransientTransactionError (Standard MongoDB Write Conflict handling)
            const isTransientError = (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) || 
                                   error.code === 112 || 
                                   strError.includes('Write conflict');
            
            // Check if error is due to Standalone instance limitation
            const isStandaloneError = error.code === 20 || strError.includes('Transaction numbers are only allowed');

            if (isTransientError && retries < MAX_RETRIES - 1) {
                console.warn(`⏳ [TX_RETRY] Write Conflict (Transient Error) detected. Retrying ${retries + 1}/${MAX_RETRIES}...`);
                retries++;
                // Wait longer between retries with exponential backoff
                await new Promise(res => setTimeout(res, 500 * retries));
                continue;
            }

            if (isStandaloneError) {
                console.warn(`⚠️ Transaction Failed: ${error.message}. Retrying without transaction...`);
                // Attempt raw execution without session
                return await callback(null);
            }

            throw error; // Real error, surface to user
        } finally {
            if (session) {
                console.log(`[TX_TRACE] Ending Session ${session.id}...`);
                try {
                    if (session.inTransaction()) await session.abortTransaction();
                } catch (e) {}
                await session.endSession();
            }
        }
    }
}

async function checkBalanceSafety(initial, final, threshold = 1000) {
    const delta = Math.abs(final - initial);
    if (delta > threshold) {
        console.error(`🚨 [SECURITY_ALERT] Excessive balance jump detected: ${initial} -> ${final} (Delta: ${delta})`);
        return false;
    }
    return true;
}

module.exports = { runTransaction, checkBalanceSafety };
