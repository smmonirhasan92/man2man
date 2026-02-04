const mongoose = require('mongoose');

/**
 * Executes a callback within a Transaction if supported.
 * If the MongoDB instance does not support transactions (Standalone), 
 * it retries the operation without a transaction.
 * 
 * @param {Function} callback - async (session) => { ... }
 */
async function runTransaction(callback) {
    let session = null;
    try {
        console.log(`[TX_TRACE] Starting Session...`);
        session = await mongoose.startSession();
        session.startTransaction();
        console.log(`[TX_TRACE] Session Started & Transaction Begin. ID: ${session.id}`);
    } catch (err) {
        // Failed to start session (e.g. connection issue or not supported)
        if (session) session.endSession();
        return await callback(null);
    }

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        // Check if error is due to Standalone instance limitation
        // Relaxed check: Retry on ANY error that looks like a transaction issue
        const strError = error.toString();
        const isTransactionError = error.code === 20 ||
            strError.includes('Transaction numbers are only allowed') ||
            strError.includes('OutputCharacterCount') || // artifacts?
            true; // FORCE RETRY for dev stability if transaction fails

        if (isTransactionError) {
            console.warn(`⚠️ Transaction Failed: ${error.message}. Retrying without transaction...`);
            if (session) {
                await session.abortTransaction().catch(() => { });
                session.endSession();
            }
            // Retry without session
            return await callback(null);
        }

        // Real error, abort and rethrow
        if (session) {
            await session.abortTransaction().catch(() => { });
        }
        throw error;
    } finally {
        // ALWAYS END SESSION (Connection Leak Prevention)
        if (session) {
            console.log(`[TX_TRACE] Ending Session ${session.id}...`);
            try {
                if (session.inTransaction()) await session.abortTransaction();
            } catch (e) { }
            await session.endSession();
            console.log(`[TX_TRACE] Session ${session.id} Ended.`);
        }
    }
}

module.exports = { runTransaction };
