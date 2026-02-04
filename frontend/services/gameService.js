import api from './api';
import { logger } from './loggerService';

export const gameService = {
    /**
     * Get Game Info (Min/Max Bet)
     */
    async getGameInfo() {
        try {
            const response = await api.get('/game');
            return response.data;
        } catch (error) {
            logger.error('Error fetching game info', error);
            throw error;
        }
    },

    /**
     * Play Coin Flip
     * @param {number} betAmount 
     * @param {string} choice 'head' or 'tail'
     */
    async playCoinFlip(betAmount, choice) {
        try {
            const response = await api.post('/game/play', { betAmount, choice });
            return response.data;
        } catch (error) {
            logger.error('Coin flip failed', error);
            throw error; // Rethrow to be caught by hook
        }
    },

    /**
     * Get Game Settings (Admin)
     */
    async getSettings() {
        try {
            const response = await api.get('/game/settings');
            return response.data;
        } catch (error) {
            logger.error('Error fetching game settings', error);
            throw error;
        }
    },

    /**
     * Update Game Settings (Admin)
     * @param {Object} settings 
     */
    async updateSettings(settings) {
        try {
            const response = await api.post('/game/settings', settings);
            return response.data;
        } catch (error) {
            logger.error('Error updating game settings', error);
            throw error;
        }
    }
};

export default gameService;
