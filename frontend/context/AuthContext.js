'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, startTransition } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const socket = useSocket(); // Global Singleton Socket
    const isMounted = useRef(false);

    // [OPTIMIZATION] Real-time Balance Sync with Spoiler Guard
    const handleBalanceUpdate = useCallback((data) => {
        // [SPOILER_GUARD] Prevent balance from natively changing until reel/scratch stops
        if (typeof window !== 'undefined' && (window.isLuckTestAnimating || window.isScratchCardAnimating || window.isMysteryVaultAnimating)) {
            // Using a single unified deferred balance variable to avoid multiple conflicting globals
            window.unifiedDeferredBalance = data;
            return;
        }

        startTransition(() => {
            setUser(prev => {
                if (!prev) return prev;
                
                let updatedWallet = { ...prev.wallet };

                if (typeof data === 'number') {
                    updatedWallet.main = data;
                } else if (typeof data === 'object' && data !== null) {
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
                    wallet_balance: updatedWallet.main,
                    game_balance: updatedWallet.game
                };
            });
        });
    }, []);

    // Initial Load
    useEffect(() => {
        isMounted.current = true;
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) { }
        }
        refreshUser().finally(() => setLoading(false));
    }, []);

    // Socket Setup
    useEffect(() => {
        if (!socket || !user?.id) return;

        // Join Room once
        socket.emit('join_user_room', user.id);

        // Single centralized listeners
        const onConnect = () => socket.emit('join_user_room', user.id);
        socket.on('connect', onConnect);
        socket.on('balance_update', handleBalanceUpdate);
        socket.on(`balance_update_${user.id}`, handleBalanceUpdate);

        // Local Sync Listener for immediate UI events from games
        const handleLocalUpdate = (e) => handleBalanceUpdate(e.detail);
        window.addEventListener('balance_update', handleLocalUpdate);

        return () => {
            socket.off('connect', onConnect);
            socket.off('balance_update', handleBalanceUpdate);
            socket.off(`balance_update_${user.id}`, handleBalanceUpdate);
            window.removeEventListener('balance_update', handleLocalUpdate);
        };
    }, [socket, user?.id, handleBalanceUpdate]);

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const { data } = await api.get('/auth/me');
            if (data && isMounted.current) {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
            }
        } catch (e) {
            if (e.response?.status === 401) {
                logout();
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        if (typeof window !== 'undefined') window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    return useContext(AuthContext);
}
