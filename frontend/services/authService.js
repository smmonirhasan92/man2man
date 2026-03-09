import api from './api';
import { logger } from './loggerService';

export const authService = {
    /**
     * Fetch current user (me)
     * @returns {Promise<Object>} User object
     */
    async getCurrentUser() {
        try {
            const response = await api.get('/auth/me');
            const user = response.data;
            // [SYNC] Normalize 'w_dat' to legacy props if present (Critical Fix)
            if (user.w_dat) {
                user.wallet_balance = user.w_dat.m_v;
                user.game_balance = user.w_dat.g_v;
                user.income_balance = user.w_dat.i_v;
                user.purchase_balance = user.w_dat.p_v;

                // [FORCE SYNC] Ensure user.wallet structure matches w_dat
                // This fixes components like WalletSwap that look at user.wallet.income
                if (!user.wallet) user.wallet = {};
                user.wallet.income = user.w_dat.i_v;
                user.wallet.main = user.w_dat.m_v;
                user.wallet.game = user.w_dat.g_v;
                user.wallet.purchase = user.w_dat.p_v;
            }
            return user;
        } catch (error) {
            logger.error('Error fetching current user (AuthService):', error.message);
            // Return null to allow UI to handle "not logged in" or "server down" state gracefully
            // instead of crashing with Unhandled Promise Rejection
            return null;
        }
    },

    /**
     * Login user
     * @param {string} phone 
     * @param {string} password 
     */
    async login(phone, password) {
        try {
            const response = await api.post('/auth/login', { phone, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                document.cookie = `token=${response.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }
            return response.data;
        } catch (error) {
            logger.error('Login failed', error);
            throw error;
        }
    },

    /**
     * Refresh User Data (Sync with backend)
     */
    async refreshUser() {
        try {
            const user = await this.getCurrentUser();
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                // [FIX] Removed auto-override of `active_server_phone`. 
                // Users with multiple servers must retain their explicit connection choice.
            }
            return user;
        } catch (error) {
            console.error('Failed to refresh user:', error);
            return null;
        }
    },

    /**
     * Register user
     * @param {Object} userData 
     */
    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                document.cookie = `token=${response.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }
            return response.data;
        } catch (error) {
            logger.error('Registration failed', error);
            throw error;
        }
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('active_server_phone');
        localStorage.removeItem('active_server_id');
        document.cookie = 'token=; path=/; max-age=0'; // Clear cookie
        window.location.href = '/login';
    }
};
