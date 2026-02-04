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
        /* 
        const handleBalanceUpdate = (data) => {
            console.log('[SOCKET] Balance Update:', data);
            setUser(prev => ({
                ...prev, 
                wallet: { ...prev.wallet, ...data },
                game_balance: data.game,
                wallet_balance: data.main
            }));
        };
        socket.on('balance_update', handleBalanceUpdate);
        return () => socket.off('balance_update', handleBalanceUpdate);
        */

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
