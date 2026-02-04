import { useState, useCallback } from 'react';
import api from '../services/api';

export const useWalletActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch Payment Settings
    const usePaymentSettings = () => {
        const [settings, setSettings] = useState({ bkash_number: '', bank_details: '', deposit_agents: [] });
        const [loadingSettings, setLoadingSettings] = useState(true);

        const fetchSettings = useCallback(async () => {
            try {
                const res = await api.get('/transactions/settings/payment');
                setSettings(res.data);
            } catch (err) {
                console.error('Failed to fetch settings');
            } finally {
                setLoadingSettings(false);
            }
        }, []);

        return { settings, loadingSettings, fetchSettings };
    };

    // Submit Recharge
    const submitRecharge = async (formData) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/transaction/add-money', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('Request submitted! 🚀');
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Error submitting request.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Submit Withdrawal
    const submitWithdrawal = async (data) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Map frontend form to backend expectation
            const payload = {
                amount: data.amount,
                method: data.method,
                details: data.accountDetails,
                tier: data.tier,
                idempotencyKey: data.idempotencyKey
            };

            await api.post('/wallet/withdraw', payload);
            setSuccess('Withdrawal request submitted successfully!');
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Withdrawal failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        success,
        submitRecharge,
        submitWithdrawal,
        usePaymentSettings,
        setError,
        setSuccess
    };
};
