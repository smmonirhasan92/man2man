'use client';
import { useState, useReducer, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RollingCounter from './RollingCounter';
import toast from 'react-hot-toast';

// Initial State
const initialState = {
    grid: Array(5).fill(Array(4).fill('?')),
    spinning: false,
    lastWin: 0,
    error: null
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'SPIN_START':
            return { ...state, spinning: true, error: null, lastWin: 0 };
        case 'SPIN_SUCCESS':
            return {
                ...state,
                spinning: false,
                grid: action.payload.grid,
                lastWin: action.payload.win, // Win Amount
                grid: action.payload.grid,
                lastWin: action.payload.win, // Win Amount
                matches: action.payload.matches, // Array of matched coords
                freeSpinRemaining: action.payload.freeSpinRemaining // Capture FS Count
            };
        case 'SPIN_ERROR':
            return { ...state, spinning: false, error: action.payload };
        default:
            return state;
    }
}

export default function SuperAceReborn() {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [bet, setBet] = useState(10);
    const [isCooling, setIsCooling] = useState(false);
    const [showWinPopup, setShowWinPopup] = useState(false);

    // Phase 1: Simple Spin
    const handleSpin = async () => {
        if (state.spinning || isCooling) return;
        if (!user) return toast.error("Please Login to Play");

        // 1. Lock & Reset
        setIsCooling(true);
        setShowWinPopup(false);
        dispatch({ type: 'SPIN_START' }); // spinning: true

        const startTime = Date.now();

        try {
            // 2. Async Calculation (First 500ms target)
            const { data } = await api.post('/game/super-ace/spin', { betAmount: bet });

            // 3. Trigger Animation (Data received, cards 'drop')
            // dispatch updates grid immediately, CSS handles drop animation
            dispatch({
                type: 'SPIN_SUCCESS',
                payload: {
                    grid: data.grid,
                    win: data.win,
                    matches: data.matches
                }
            });

            // 4. Update Balance (Delayed for visual sync)
            // Prevent spoiler by waiting for drop animation (~1s)
            setTimeout(() => {
                setUser(prev => ({
                    ...prev,
                    game_balance: data.balance,
                    wallet: { ...prev.wallet, game: data.balance, main: data.wallet_balance }
                }));
            }, 1200);

            // 5. Sync Win Popup (1.8s mark)
            if (data.win > 0) {
                setTimeout(() => {
                    setShowWinPopup(true);
                    // Play Win Sound here if needed
                }, 1800);
            }

            // 6. Enforce 2 Second Cooldown (Total Cycle)
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 2000 - elapsed);

            setTimeout(() => {
                setIsCooling(false);
                setShowWinPopup(false); // Hide popup for next spin (or keep it longer? User said 2s cycle. We'll hide on next click or timeout)
                // Actually, let's keep popup until next spin starts or 3s.
                // But for "Reloading", button enables at 2s.
            }, remaining);

        } catch (e) {
            console.error(e);
            dispatch({ type: 'SPIN_ERROR', payload: e.response?.data?.message || e.message });
            setIsCooling(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#001219] text-white flex flex-col font-sans relative">
            {/* Background VFX */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black opacity-80 pointer-events-none"></div>

            {/* HEADER - Compact */}
            <div className="shrink-0 h-14 px-4 bg-black/60 backdrop-blur-md flex justify-between items-center shadow-lg border-b border-white/5 relative z-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-300 font-bold hover:text-white transition active:scale-95">
                    <ArrowLeft className="w-5 h-5" /> LOBBY
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 uppercase tracking-widest leading-none">
                        SUPER ACE <span className="text-yellow-400">CLASSIC</span>
                    </div>
                    <div className="text-[9px] text-blue-400 font-bold flex items-center gap-1 cursor-pointer bg-blue-900/20 px-2 rounded-full border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        VERIFIED 🛡️
                    </div>
                </div>

                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">VAULT</span>
                    <span className="font-bold text-base text-yellow-500 font-mono">
                        <RollingCounter value={user?.wallet?.game || 0} />
                    </span>
                </div>
            </div>

            {/* Error Banner */}
            {state.error && (
                <div className="absolute top-16 inset-x-0 z-40 flex justify-center pointer-events-none">
                    <div className="bg-red-900/90 text-red-200 border border-red-500/50 px-6 py-2 rounded-full text-sm font-bold shadow-xl animate-bounce">
                        ⚠️ {state.error}
                    </div>
                </div>
            )}

            {/* FREE SPIN BANNER */}
            {state.freeSpinRemaining > 0 && (
                <div className="absolute top-14 left-0 right-0 z-30 bg-gradient-to-r from-purple-900/0 via-purple-600/50 to-purple-900/0 text-center py-1">
                    <span className="text-purple-200 text-sm font-black tracking-widest drop-shadow-[0_0_10px_#a855f7] animate-pulse">
                        ⚡ FREE SPINS ACTIVE: {state.freeSpinRemaining} ⚡
                    </span>
                </div>
            )}

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 overflow-hidden w-full max-w-lg mx-auto">
                {/* Win Overlay */}
                {showWinPopup && state.lastWin > 0 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-xl p-8 rounded-2xl border border-yellow-500/50 animate-bounce shadow-[0_0_100px_rgba(234,179,8,0.3)] text-center scale-150 transform">
                            <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest">Victory</h2>
                            <div className="text-5xl font-black text-white mt-2 font-mono drop-shadow-xl">
                                ৳{state.lastWin.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {/* GRID */}
                <div className="w-full aspect-[5/4] max-h-[60vh] bg-slate-900 p-2 rounded-xl border border-slate-700 shadow-2xl relative grid grid-cols-5 gap-1.5 sm:gap-2">
                    {state.grid.map((col, cIdx) => (
                        <div key={cIdx} className="flex flex-col gap-1.5 sm:gap-2 h-full">
                            {col.map((sym, rIdx) => {
                                const isMatch = state.matches?.some(m => m.c === cIdx && m.r === rIdx);
                                const isGold = sym.startsWith('GOLD');
                                const displaySym = sym.replace('GOLD_', '').replace('SCATTER', '💎').replace('WILD', '🃏');

                                return (
                                    <div
                                        key={`${cIdx}-${rIdx}`}
                                        className={`
                                            flex-1 bg-gradient-to-b from-blue-900 to-slate-900 rounded-md flex items-center justify-center border
                                            ${isGold ? 'border-yellow-500/80 from-amber-900 to-yellow-900' : 'border-blue-700/30'}
                                            ${state.spinning ? 'opacity-50 blur-[1px]' : ''}
                                            ${isMatch ? 'ring-2 ring-yellow-400 z-10 scale-105 bg-yellow-900/50' : ''}
                                            relative overflow-hidden shadow-inner
                                        `}
                                    >
                                        <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-serif ${isGold ? 'text-yellow-200' : 'text-slate-100'} drop-shadow-lg`}>
                                            {displaySym}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* CONTROLS */}
                {/* CONTROLS */}
                <div className="mt-auto w-full pt-4 px-4 pb-[90px] relative z-50">
                    <div className="flex flex-col gap-4">

                        {/* Bet Controls (Top Row) */}
                        <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-xl">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2">Total Bet</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setBet(Math.max(10, bet - 10))} disabled={isCooling}
                                    className="w-12 h-10 bg-slate-800 text-white rounded-xl active:scale-95 transition flex items-center justify-center text-xl font-bold shadow-lg border border-white/5">
                                    -
                                </button>
                                <span className="w-20 text-center font-black text-2xl text-yellow-400 font-mono tracking-tighter shadow-[0_0_10px_rgba(250,204,21,0.2)] bg-black/50 rounded-lg py-1">
                                    {bet}
                                </span>
                                <button onClick={() => setBet(bet + 10)} disabled={isCooling}
                                    className="w-12 h-10 bg-slate-800 text-white rounded-xl active:scale-95 transition flex items-center justify-center text-xl font-bold shadow-lg border border-white/5">
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Spin Button (Bottom Row - Huge) */}
                        <button
                            onClick={handleSpin}
                            disabled={isCooling}
                            className={`
                                w-full h-20 rounded-2xl font-black text-3xl italic uppercase tracking-widest transition-all relative overflow-hidden group shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)]
                                flex flex-col items-center justify-center gap-1
                                ${isCooling
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800 text-white hover:scale-[1.02] active:scale-[0.98] border-t-2 border-blue-400'}
                            `}
                        >
                            <span className="relative z-10 drop-shadow-md">
                                {isCooling ? 'Loading...' : 'SPIN'}
                            </span>
                            {!isCooling && <span className="text-[10px] opacity-60 font-normal tracking-normal relative z-10">TAP TO PLAY</span>}

                            {/* Shiny Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
