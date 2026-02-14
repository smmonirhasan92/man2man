'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '../../services/api';
import { Ticket } from 'lucide-react';
import LotteryHistory from './LotteryHistory';
import { useSocket } from '../../hooks/useSocket';
import toast, { Toaster } from 'react-hot-toast';

const PremiumLottery = dynamic(() => import('./PremiumLottery'), {
    loading: () => <div className="w-full h-64 bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});

// LotteryDashboard.js
export default function LotteryDashboard() {
    const [activeTab, setActiveTab] = useState('TIER_10M');
    const [history, setHistory] = useState([]);
    const socket = useSocket();

    // We could fetch all slots here and pass them down, 
    // OR let each PremiumLottery widget fetch its own data.
    // Fetching here allows for a "skeleton" load state for the whole dashboard.
    // For simplicity given the short time, let's keep the widgets self-contained 
    // or pass the tier as a prop and let them mount/unmount.

    useEffect(() => {
        loadHistory();

        // GLOBAL WINNER TICKER
        if (socket) {
            socket.on('LOTTERY_WIN_MULTI', (data) => {
                // Show toast for every win if it's NOT the custom celebration (which might be handled by the specific widget)
                // Or just show a nice notification for everything.
                // data.winners is an array.
                data.winners.forEach(w => {
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-gradient-to-r from-yellow-600 to-yellow-900 border border-yellow-400 p-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[300px]`}>
                            <div className="text-3xl">🎉</div>
                            <div>
                                <h4 className="text-yellow-200 font-bold text-xs uppercase tracking-widest">Global Win Alert</h4>
                                <p className="text-white font-bold">
                                    User {w.userId.substr(-4)} just won <span className="text-yellow-400">{w.wonAmount} TK</span>!
                                </p>
                                <p className="text-[10px] text-yellow-500/80 uppercase">{w.tierName || 'Lottery Win'}</p>
                            </div>
                        </div>
                    ), { duration: 5000, position: 'top-center' });
                });
                // Reload history to show new win
                loadHistory();
            });
        }

        return () => {
            if (socket) socket.off('LOTTERY_WIN_MULTI');
        };
    }, [socket]);

    const [viewMode, setViewMode] = useState('GLOBAL'); // GLOBAL | MY_TICKETS

    useEffect(() => {
        loadHistory();
    }, [viewMode]); // Reload when mode changes

    // ... (socket listener same)

    const loadHistory = async () => {
        try {
            if (viewMode === 'GLOBAL') {
                const res = await api.get('/lottery/history');
                setHistory(Array.isArray(res.data) ? res.data : []);
            } else {
                const res = await api.get('/lottery/my-tickets');
                setHistory(Array.isArray(res.data) ? res.data : []);
            }
        } catch (e) {
            console.error("History Load Error", e);
            setHistory([]);
        }
    };

    const TABS = [
        { id: 'TIER_10M', label: '10m', color: 'text-blue-500', border: 'border-blue-500' },
        { id: 'TIER_30M', label: '30m', color: 'text-emerald-500', border: 'border-emerald-500' },
        { id: 'TIER_1H', label: '1h', color: 'text-amber-500', border: 'border-amber-500' },
        { id: 'TIER_6H', label: '6h', color: 'text-yellow-500', border: 'border-yellow-500' },
        { id: 'TIER_12H', label: '12h', color: 'text-orange-500', border: 'border-orange-500' },
        { id: 'TIER_24H', label: '24h', color: 'text-cyan-500', border: 'border-cyan-500' },
        { id: 'TIER_3D', label: '3d', color: 'text-purple-500', border: 'border-purple-500' },
        { id: 'TIER_7D', label: '7d', color: 'text-red-500', border: 'border-red-500' }
    ];

    return (
        <div className="p-4 space-y-8 max-w-4xl mx-auto">
            <Toaster />
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
                    <Ticket className="text-yellow-400 w-8 h-8" />
                    LOTTERY ECOSYSTEM
                </h2>
                <p className="text-slate-400 text-sm">Choose your game pace. Win Big.</p>
            </div>

            {/* TABS */}
            <div className="flex border-b border-white/10">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-sm font-bold uppercase transition-all relative ${activeTab === tab.id ? `${tab.color}` : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className={`absolute bottom-0 left-0 w-full h-1 ${tab.color.replace('text', 'bg')} rounded-t-full`}></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Active Lottery Widget (Dynamic based on Tab) */}
            <div className="w-full min-h-[400px]">
                {/* We mount a fresh component on tab change to reset its internal state cleanly */}
                <PremiumLottery key={activeTab} tier={activeTab} />
            </div>

            {/* History Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-300">
                        <span>{viewMode === 'GLOBAL' ? '📜 Ecosystem Wins' : '🎫 My Entries'}</span>
                    </h2>
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setViewMode('GLOBAL')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${viewMode === 'GLOBAL' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setViewMode('MY_TICKETS')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${viewMode === 'MY_TICKETS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            My Entries
                        </button>
                    </div>
                </div>
            </div>



            <LotteryHistory history={history} mode={viewMode} />
        </div>

    );
}
