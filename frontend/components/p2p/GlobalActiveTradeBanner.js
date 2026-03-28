'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function GlobalActiveTradeBanner() {
    const [activeTrade, setActiveTrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();
    const systemSocket = useSocket('/system');

    // Re-fetch trades on mount and socket events
    const checkActiveTrades = async () => {
        if (!user) {
            setActiveTrade(null);
            setLoading(false);
            return;
        }
        
        try {
            const res = await api.get('/p2p/my-trades');
            if (res.data && Array.isArray(res.data)) {
                // Find ANY trade that is CREATED, PAID, or DISPUTED
                const ongoing = res.data.find(t => ['CREATED', 'PAID', 'DISPUTED'].includes(t.status));
                setActiveTrade(ongoing || null);
            }
        } catch (e) {
            console.error("Failed to fetch running trades", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkActiveTrades();

        if (systemSocket) {
            const handleEvent = (data) => {
                // To avoid redundant refetches, only fetch if the auth user is involved
                if (!data || data.sellerId === user?._id || data.buyerId === user?._id || data.tradeId) {
                    checkActiveTrades();
                }
            };
            
            systemSocket.on('p2p_trade_start', handleEvent);
            systemSocket.on('p2p_mark_paid', handleEvent);
            systemSocket.on('p2p_completed', handleEvent);
            systemSocket.on('p2p_alert', handleEvent);

            return () => {
                systemSocket.off('p2p_trade_start', handleEvent);
                systemSocket.off('p2p_mark_paid', handleEvent);
                systemSocket.off('p2p_completed', handleEvent);
                systemSocket.off('p2p_alert', handleEvent);
            };
        }
    }, [systemSocket, user]);

    // Don't render if it's loading, there is no trade, or no user
    if (loading || !activeTrade || !user) return null;

    const amIBuyer = activeTrade.buyerId === user._id;
    const isActionRequired = (activeTrade.status === 'CREATED' && amIBuyer) || (activeTrade.status === 'PAID' && !amIBuyer);

    return (
        <div 
            onClick={() => router.push(`/p2p?tradeId=${activeTrade._id}`)}
            className="fixed top-12 left-1/2 transform -translate-x-1/2 z-[100] w-[90%] max-w-sm"
        >
            <div className={`p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all backdrop-blur-md flex items-center justify-between border ${
                isActionRequired 
                ? 'bg-[#fcd535]/90 text-black border-[#fcd535]' // Golden Alert
                : 'bg-[#1e2329]/95 text-[#eaeaec] border-[#0ecb81]/50' // Wait State
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isActionRequired ? 'bg-black/10 text-black animate-pulse' : 'bg-[#0ecb81]/20 text-[#0ecb81] animate-spin-slow'
                    }`}>
                        {isActionRequired ? <Zap className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    <div>
                        <p className={`text-[10px] uppercase font-black tracking-widest ${isActionRequired ? 'text-black/70' : 'text-[#848e9c]'}`}>
                            Running P2P Trade • {activeTrade.status}
                        </p>
                        <p className="font-bold text-sm">
                            {activeTrade.amount} NXS • {isActionRequired ? 'Action Needed!' : 'Please Wait'}
                        </p>
                    </div>
                </div>
                <div className={`p-2 rounded-full ${isActionRequired ? 'bg-black/10 text-black' : 'bg-[#2b3139] text-[#eaeaec]'}`}>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
