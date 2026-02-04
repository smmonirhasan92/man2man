/**
 * Mock Payment Gateway Service
 * Simulates integration with Bkash/Nagad Merchant APIs.
 */
class PaymentGatewayService {

    /**
     * Initiate a B2C Payout
     * @param {string} recipient - Phone Number
     * @param {number} amount - Amount in BDT
     * @param {string} method - 'bkash' | 'nagad' | 'rocket'
     */
    static async initiatePayout(recipient, amount, method) {
        console.log(`[GATEWAY] Initiating Payout: ${amount} BDT to ${recipient} via ${method}...`);

        return new Promise((resolve) => {
            // Simulate API Latency
            setTimeout(() => {
                const trxId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                console.log(`[GATEWAY] Payout Success! TrxID: ${trxId}`);
                resolve({
                    success: true,
                    transactionId: trxId,
                    message: 'Processed by Payment Gateway'
                });
            }, 1500);
        });
    }
}

module.exports = PaymentGatewayService;
