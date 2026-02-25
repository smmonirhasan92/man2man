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
    const [history, setHistory] = useState([]);
    const [activeLots, setActiveLots] = useState([]); // [HYBRID] Store all active lotteries
    const [loadingSlots, setLoadingSlots] = useState(true);
    const [viewMode, setViewMode] = useState('GLOBAL'); // GLOBAL | MY_TICKETS
    const socket = useSocket();

    useEffect(() => {
        loadHistory();
        loadActiveSlots();

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
                                    User {w.userId.substr(-4)} just won <span className="text-yellow-400">{w.wonAmount} NXS</span>!
                                </p>
                                <p className="text-[10px] text-yellow-500/80 uppercase">{w.tierName || 'Lottery Win'}</p>
                            </div>
                        </div>
                    ), { duration: 5000, position: 'top-center' });
                });
                // Reload both to show new win and update active slots
                loadHistory();
                loadActiveSlots();
            });
        }

        return () => {
            if (socket) socket.off('LOTTERY_WIN_MULTI');
        };
    }, [socket]);

    useEffect(() => {
        loadHistory();
    }, [viewMode]);

    const loadActiveSlots = async () => {
        try {
            setLoadingSlots(true);
            // Fetch ALL active lotteries (Hybrid System)
            const res = await api.get('/lottery/active');
            if (Array.isArray(res.data)) {
                setActiveLots(res.data);
            } else if (res.data && res.data.status !== 'INACTIVE') {
                setActiveLots([res.data]); // Fallback if API returns single object
            } else {
                setActiveLots([]);
            }
        } catch (e) {
            console.error("Active Slots Load Error", e);
        } finally {
            setLoadingSlots(false);
        }
    };

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

    return (
        <div className="p-4 space-y-8 max-w-4xl mx-auto">
            <Toaster />
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
                    <Ticket className="text-yellow-400 w-8 h-8" />
                    ECOSYSTEM REWARDS
                </h2>
                <p className="text-slate-400 text-sm">Select your desired reward tier. Participate to win.</p>
            </div>

            {/* NEW HYBRID GRID VIEW */}
            <div className="w-full">
                {loadingSlots ? (
                    <div className="grid grid-cols-1 gap-6 animate-pulse">
                        <div className="min-h-96 bg-white/5 rounded-2xl"></div>
                        <div className="min-h-96 bg-white/5 rounded-2xl hidden md:block"></div>
                    </div>
                ) : activeLots.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                        {activeLots.map((slot) => (
                            <PremiumLottery key={slot.slotId} tier={slot.tier} initialData={slot} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#111] rounded-2xl p-10 border border-white/5 text-center flex flex-col items-center justify-center">
                        <Ticket className="w-16 h-16 text-slate-600 mb-4 opacity-50" />
                        <h3 className="text-slate-400 font-bold text-xl">No Active Draws</h3>
                        <p className="text-sm text-slate-500 mt-2">Check back later for new rewards.</p>
                    </div>
                )}
            </div>

            {/* History Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-300">
                        <span>{viewMode === 'GLOBAL' ? '📜 Ecosystem Rewards' : '🎫 My Entries'}</span>
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
