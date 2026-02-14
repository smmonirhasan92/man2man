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
        const handleBalanceUpdate = (data) => {
            console.log('[SOCKET] Balance Update:', data);

            // Handle both simple number (legacy) and object formats
            let newIncome = 0;
            let newMain = 0;

            if (typeof data === 'number') {
                newIncome = data; // Assume income if single number
            } else if (typeof data === 'object') {
                newIncome = data.income || data.wallet?.income || 0;
                newMain = data.main || data.wallet?.main || 0;
            }

            setUser(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    wallet: {
                        ...prev.wallet,
                        income: newIncome || prev.wallet?.income, // Update if present
                        main: newMain || prev.wallet?.main        // Update if present
                    },
                    // Update legacy/aliased fields if they exist
                    wallet_balance: (newMain || prev.wallet?.main) || prev.wallet_balance
                };
            });
        };

        // Listen for both event types for robustness
        socket.on('balance_update', handleBalanceUpdate);
        socket.on(`balance_update_${user.id}`, handleBalanceUpdate);

        return () => {
            socket.off('balance_update', handleBalanceUpdate);
            socket.off(`balance_update_${user.id}`, handleBalanceUpdate);
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
