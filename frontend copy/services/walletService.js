import api from './api';
import { logger } from './loggerService';

export const walletService = {
    /**
     * Get user wallet balance
     */
    async getBalance() {
        try {
            const response = await api.get('/wallet/balance');
            const data = response.data;
            // [SYNC] Normalize 'w_dat'
            if (data.w_dat) {
                data.wallet_balance = data.w_dat.m_v;
                data.game_balance = data.w_dat.g_v;
                data.income_balance = data.w_dat.i_v;
                data.purchase_balance = data.w_dat.p_v;
            }
            return data;
        } catch (error) {
            logger.error('Error fetching balance', error);
            throw error;
        }
    },

    /**
     * Get transaction history
     */
    async getHistory() {
        try {
            const response = await api.get('/transaction/history');
            return response.data;
        } catch (error) {
            logger.error('Error fetching transaction history', error);
            throw error;
        }
    },

    /**
     * Initiate a recharge (deposit)
     * @param {Object} data { amount, method, transactionId }
     */
    async recharge(data) {
        try {
            const response = await api.post('/wallet/recharge', data);
            return response.data;
        } catch (error) {
            logger.error('Recharge failed', error);
            throw error;
        }
    },

    /**
     * Request a withdrawal
     * @param {Object} data { amount, method, accountNumber }
     */
    async withdraw(data) {
        try {
            const response = await api.post('/wallet/withdraw', data);
            return response.data;
        } catch (error) {
            logger.error('Withdrawal failed', error);
            throw error;
        }
    }
};
