'use client';
import React from 'react';
import UniversalSlot from '../../../components/game/slot/UniversalSlot';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const VALID_THEMES = ['royale', 'classic', 'gems', 'fruits', 'diamonds', 'botanical', 'navy'];

// Dynamic Import for Pro Engine (Client Side Only)
const SuperAceProGame = dynamic(() => import('../../../components/games/super-ace/SuperAceProGame'), {
    loading: () => <div className="min-h-screen bg-[#020617] flex items-center justify-center text-[#d4af37]">Loading Pro Engine...</div>,
    ssr: false
});

export default function GameClient({ theme }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    // Auth & User Load
    React.useEffect(() => {
        const load = async () => {
            try {
                // Dynamic import to avoid SSR issues if api uses window
                const { authService } = await import('../../../services/authService');
                const userData = await authService.getCurrentUser();

                if (userData) {
                    setUser(userData);
                } else {
                    console.warn("Auth Service returned null user - Server might be booting or user not logged in.");
                }
            } catch (e) {
                console.error("Auth Load Failed", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (!VALID_THEMES.includes(theme)) {
        console.error(`[ROUTE_CHECKER] Invalid theme accessed: ${theme}`);
        return notFound();
    }

    // Special Routing for Master UI / Pro Model
    if (theme === 'navy') {
        const { CardSkinProvider } = require('@/context/CardSkinContext');
        return (
            <CardSkinProvider>
                <SuperAceProGame theme={theme} />
            </CardSkinProvider>
        );
    }

    const handleSpin = async (betAmount) => {
        const api = (await import('../../../services/api')).default;
        // Call Unified Backend
        const res = await api.post('/game/super-ace/spin', { betAmount });
        if (res.data) {
            // Update local balance immediately for UI responsiveness
            setUser(prev => ({ ...prev, wallet_balance: res.data.finalBalance }));
            return res.data;
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center">Loading...</div>;

    return (
        <UniversalSlot
            theme={theme}
            balance={user?.wallet_balance || 0}
            onSpin={handleSpin}
        />
    );
}
