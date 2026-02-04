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

                // [SYNC] Update Active Server Metadata if present
                if (user.synthetic_phone) {
                    localStorage.setItem('active_server_phone', user.synthetic_phone);
                    // [FIX] Also persist ID and Name to unlock Task UI
                    // Assuming user object has these fields populated from backend or we use defaults
                    if (user.active_plan_id) localStorage.setItem('active_server_id', user.active_plan_id);
                    if (user.active_plan_name) localStorage.setItem('active_server_name', user.active_plan_name);

                    // Fallback for "Restore" - If we have phone but no ID (Legacy User), make one up to bypass UI lock
                    if (!localStorage.getItem('active_server_id')) {
                        localStorage.setItem('active_server_id', 'legacy_server_01');
                        localStorage.setItem('active_server_name', 'USA PRIMARY');
                    }
                }
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
        window.location.href = '/';
    }
};
