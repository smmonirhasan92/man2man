'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import { Zap, Loader2 } from 'lucide-react';
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
            className="fixed top-24 right-4 z-[100] flex flex-col items-end gap-2 group"
        >
            {/* Minimal Pill */}
            <div className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-[1.05] active:scale-[0.95] backdrop-blur-xl border transition-all duration-300 ${
                isActionRequired 
                ? 'bg-[#fcd535]/95 text-black border-[#fcd535]' // Golden Alert
                : 'bg-[#1e2329]/95 text-[#eaeaec] border-[#0ecb81]/50' // Wait State
            }`}>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${isActionRequired ? 'bg-black/10' : 'bg-[#0ecb81]/20 text-[#0ecb81]'}`}>
                    {isActionRequired ? <Zap className="w-4 h-4 text-black animate-pulse" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    
                    {/* Ping animation for action required */}
                    {isActionRequired && (
                        <span className="absolute inset-0 rounded-full border-2 border-black/50 animate-ping opacity-50"></span>
                    )}
                </div>
                
                <div className="flex flex-col max-w-[120px]">
                    <span className={`text-[8px] uppercase font-black tracking-widest leading-none ${isActionRequired ? 'text-black/70' : 'text-[#848e9c]'}`}>
                        P2P • {activeTrade.status}
                    </span>
                    <span className="text-xs font-bold leading-tight truncate mt-0.5">
                        {isActionRequired ? 'Action Needed!' : 'In Progress'}
                    </span>
                </div>
            </div>
        </div>
    );
}
