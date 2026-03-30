'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import { useSocket } from './useSocket';

export const useAuth = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const socket = useSocket(); // Connect to Global Namespace

    // Initial Load & Socket Listeners
    useEffect(() => {
        // Load local
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error('Invalid user data in storage');
            }
        }
        refreshUser(); // Sync with Server on Load
    }, []);

    // Socket Event Handling
    useEffect(() => {
        if (!socket || !user?.id) return;

        // Join Room
        socket.emit('join_user_room', user.id);

        // [PERFORMANCE FIX] Disabled Global Balance Listener in Hook
        // Prevents duplicate listeners from Sidebar/Header/Game causing render spam.
        // Game components update balance via API response mainly.
        // [ENABLED] Real-time Balance Sync
        // [PERFORMANCE FIX] Real-time Balance Sync
        const handleBalanceUpdate = (data) => {
            console.log('[SOCKET] Balance Update Received:', data);

            setUser(prev => {
                if (!prev) return prev;
                
                let updatedWallet = { ...prev.wallet };

                if (typeof data === 'number') {
                    // Legacy check: If it's just a number, it's often the main balance or income.
                    // To be safe, we check the global "balance_update" vs user-specific.
                    // But for this app, single number usually means Main Balance (NXS).
                    updatedWallet.main = data;
                } else if (typeof data === 'object' && data !== null) {
                    // New format: can be { main, income, game } or { wallet: { ... } }
                    const source = data.wallet || data;
                    if (source.main !== undefined) updatedWallet.main = source.main;
                    if (source.income !== undefined) updatedWallet.income = source.income;
                    if (source.game !== undefined) updatedWallet.game = source.game;
                    if (source.purchase !== undefined) updatedWallet.purchase = source.purchase;
                    if (source.agent !== undefined) updatedWallet.agent = source.agent;
                }

                return {
                    ...prev,
                    wallet: updatedWallet,
                    // Sync legacy top-level fields for total compatibility
                    wallet_balance: updatedWallet.main,
                    game_balance: updatedWallet.game
                };
            });
        };

        // Listen for both event types for robustness
        socket.on('balance_update', handleBalanceUpdate);
        socket.on(`balance_update_${user.id}`, handleBalanceUpdate);

        // [LOCAL SYNC] Listen for immediate UI events from games
        const handleLocalUpdate = (e) => handleBalanceUpdate(e.detail);
        window.addEventListener('balance_update', handleLocalUpdate);

        return () => {
            socket.off('balance_update', handleBalanceUpdate);
            socket.off(`balance_update_${user.id}`, handleBalanceUpdate);
            window.removeEventListener('balance_update', handleLocalUpdate);
        };

    }, [socket, user?.id]);

    const logout = () => {
        // Clear Local Storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('pwa-prompt-dismissed');

        // Clear Cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Redirect
        router.push('/');
        setTimeout(() => window.location.reload(), 500);
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return; // Skip if no token (Guest)

        try {
            const { data } = await api.get('/auth/me'); // Ensure this endpoint returns user object
            if (data) {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
            }
        } catch (e) {
            console.error('Failed to refresh user:', e);
            if (e.response && e.response.status === 401) {
                // Double check cleanup if API didn't handle it (race condition)
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        }
    };

    return { user, setUser, logout, refreshUser };
};
