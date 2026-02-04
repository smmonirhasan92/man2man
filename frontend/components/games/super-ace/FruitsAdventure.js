'use client';
import { useState, useReducer, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { ArrowLeft, Citrus, Grape, Apple, Diamond } from 'lucide-react';
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
                lastWin: action.payload.win,
                matches: action.payload.matches,
                freeSpinRemaining: action.payload.freeSpinRemaining
            };
        case 'SPIN_ERROR':
            return { ...state, spinning: false, error: action.payload };
        default:
            return state;
    }
}

export default function FruitsAdventure() {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [bet, setBet] = useState(10);
    const [isCooling, setIsCooling] = useState(false);
    const [showWinPopup, setShowWinPopup] = useState(false);

    // MAPPING LOGIC
    const getFruitSymbol = (sym) => {
        const raw = sym.replace('GOLD_', '');
        switch (raw) {
            case 'J': return '🍊'; // Orange
            case 'Q': return '🍇'; // Grapes
            case 'K': return '🐉'; // Dragon Fruit
            case 'A': return '🍎'; // Apple
            case 'WILD': return '🍓'; // Golden Strawberry
            case 'SCATTER': return '🍍'; // Pineapple
            default: return raw;
        }
    };

    const handleSpin = async () => {
        if (state.spinning || isCooling) return;
        if (!user) return toast.error("Please Login to Play");

        setIsCooling(true);
        setShowWinPopup(false);
        dispatch({ type: 'SPIN_START' });

        const startTime = Date.now();

        try {
            const { data } = await api.post('/game/super-ace/spin', { betAmount: bet });

            dispatch({
                payload: {
                    grid: data.grid,
                    win: data.win,
                    matches: data.matches,
                    freeSpinRemaining: data.freeSpinRemaining, // Capture FS
                    meta: data.meta // Pass Meta
                }
            });

            // [DOPAMINE SYNC]
            if (data.meta && data.meta.nearMiss) {
                // Trigger Near Miss Visuals
                // We can shake the screen or show a "SO CLOSE!" tooltip
                console.log("[FRUITS] Near Miss Triggered!");
                // Implementation: Add a shake effect or toast?
                // For now, let's just log it or maybe set a state if we had one.
                // Or better: Delay the "Spin End" slightly to induce tension?
                // User requirement: "Excitement Animations... even if it's a Near-Miss".
            }

            // Delay balance update to sync with animation (anti-spoiler)
            setTimeout(() => {
                setUser(prev => ({
                    ...prev,
                    game_balance: data.balance,
                    wallet: { ...prev.wallet, game: data.balance, main: data.wallet_balance }
                }));
            }, 1200);

            if (data.win > 0) {
                setTimeout(() => {
                    setShowWinPopup(true);
                }, 1800);
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 2000 - elapsed);

            setTimeout(() => {
                setIsCooling(false);
                setShowWinPopup(false);
            }, remaining);

        } catch (e) {
            console.error(e);
            dispatch({ type: 'SPIN_ERROR', payload: e.response?.data?.message || e.message });
            setIsCooling(false);
        }
    };

    return (
        <div className="h-[100dvh] bg-[#2d0a0a] text-white flex flex-col font-sans overflow-hidden relative">
            {/* Background VFX - Juice Theme */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900 via-red-950 to-black opacity-80 pointer-events-none"></div>

            {/* HEADER - Compact */}
            <div className="shrink-0 h-14 px-4 bg-black/40 backdrop-blur-md flex justify-between items-center shadow-lg border-b border-white/5 relative z-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-orange-200 font-bold hover:text-white transition active:scale-95">
                    <ArrowLeft className="w-5 h-5" /> LOBBY
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-200 to-red-400 uppercase tracking-widest leading-none drop-shadow-sm">
                        FRUITS <span className="text-green-400">ADVENTURE</span>
                    </div>
                    <div className="text-[9px] text-green-400 font-bold flex items-center gap-1 cursor-pointer bg-green-900/20 px-2 rounded-full border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        VERIFIED 🛡️
                    </div>
                </div>

                <div className="bg-red-950/80 px-3 py-1.5 rounded-lg border border-red-800 flex items-center gap-2 shadow-inner">
                    <span className="text-[10px] text-red-300 font-bold uppercase">JUICE</span>
                    <span className="font-bold text-base text-yellow-400 font-mono">
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
                <div className="absolute top-14 left-0 right-0 z-30 bg-gradient-to-r from-green-900/0 via-green-600/50 to-green-900/0 text-center py-1">
                    <span className="text-green-100 text-sm font-black tracking-widest drop-shadow-[0_0_10px_#22c55e] animate-pulse">
                        🍒 FREE SPINS: {state.freeSpinRemaining} 🍒
                    </span>
                </div>
            )}

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 overflow-hidden w-full max-w-lg mx-auto">

                {/* Win Overlay */}
                {showWinPopup && state.lastWin > 0 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-xl p-8 rounded-2xl border border-orange-500/50 animate-bounce shadow-[0_0_100px_rgba(249,115,22,0.3)] text-center scale-150 transform">
                            <h2 className="text-3xl font-black text-orange-400 uppercase tracking-widest">Sweet!</h2>
                            <div className="text-5xl font-black text-white mt-2 font-mono drop-shadow-xl">
                                ৳{state.lastWin.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {/* GRID */}
                <div className="w-full aspect-[5/4] max-h-[60vh] bg-[#1a0505] p-2 rounded-xl border border-red-900 shadow-2xl relative grid grid-cols-5 gap-1.5 sm:gap-2">
                    {state.grid.map((col, cIdx) => (
                        <div key={cIdx} className="flex flex-col gap-1.5 sm:gap-2 h-full">
                            {col.map((sym, rIdx) => {
                                const isMatch = state.matches?.some(m => m.c === cIdx && m.r === rIdx);
                                const isGold = sym.startsWith('GOLD');
                                const displaySym = getFruitSymbol(sym);

                                return (
                                    <div
                                        key={`${cIdx}-${rIdx}`}
                                        className={`
                                            flex-1 bg-gradient-to-b from-red-900 to-red-950 rounded-md flex items-center justify-center border
                                            ${isGold ? 'border-yellow-500/80 from-orange-800 to-red-900' : 'border-red-800/30'}
                                            ${state.spinning ? 'opacity-50 blur-[1px]' : ''}
                                            ${isMatch ? 'ring-2 ring-green-400 z-10 scale-105 bg-green-900/50' : ''}
                                            relative overflow-hidden shadow-inner
                                        `}
                                    >
                                        <span className={`text-3xl sm:text-4xl lg:text-5xl drop-shadow-lg select-none ${sym === 'SCATTER' ? 'animate-bounce' : ''}`}>
                                            {displaySym}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* CONTROLS */}
                <div className="mt-auto w-full pt-4 pb-2">
                    <div className="flex gap-3 items-stretch bg-red-950/80 backdrop-blur p-3 rounded-2xl border border-red-900 shadow-2xl">
                        {/* Bet Controls */}
                        <div className="flex flex-col justify-center gap-1 flex-1">
                            <label className="text-[9px] text-red-200 uppercase font-black tracking-widest text-center">Stake</label>
                            <div className="flex items-center justify-between bg-black/40 p-1 rounded-xl border border-red-900 h-10">
                                <button onClick={() => setBet(Math.max(1, bet - 10))} disabled={isCooling} className="w-8 h-full bg-red-900 text-red-200 rounded-lg hover:bg-red-800 font-bold">-</button>
                                <span className="flex-1 text-center font-bold text-lg text-white font-mono tracking-tighter">{bet}</span>
                                <button onClick={() => setBet(bet + 10)} disabled={isCooling} className="w-8 h-full bg-red-900 text-red-200 rounded-lg hover:bg-red-800 font-bold">+</button>
                            </div>
                        </div>

                        {/* Spin Button */}
                        <button
                            onClick={handleSpin}
                            disabled={isCooling}
                            className={`
                                flex-[1.5] rounded-xl font-black text-xl uppercase tracking-widest transition-all relative overflow-hidden group shadow-lg
                                ${isCooling
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                                    : 'bg-gradient-to-br from-green-500 to-green-700 text-white hover:from-green-400 hover:to-green-600 border-t border-green-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]'}
                            `}
                        >
                            {isCooling ? '...' : 'JUICE'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
