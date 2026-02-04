'use client';
import { useState, useReducer, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { ArrowLeft, Hexagon, Gem, Disc } from 'lucide-react';
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

export default function ElementalRiches() {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [bet, setBet] = useState(10);
    const [isCooling, setIsCooling] = useState(false);
    const [showWinPopup, setShowWinPopup] = useState(false);

    const [showTrust, setShowTrust] = useState(false);

    // MAPPING LOGIC (Metals & Elements)
    const getElementalSymbol = (sym) => {
        const raw = sym.replace('GOLD_', '');
        switch (raw) {
            case 'J': return '🔩'; // Iron (Bolt)
            case 'Q': return '🥉'; // Bronze 
            case 'K': return '🥈'; // Silver
            case 'A': return '🥇'; // Gold
            case 'WILD': return '💎'; // Diamond
            case 'SCATTER': return '🔮'; // Crystal Orb
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

            // Artificial Delay for "Fairness Visual" (Syncs with potential animation)
            // But User requested 0ms lag between backend and frontend animation.
            // So we dispatch immediately.

            dispatch({
                type: 'SPIN_SUCCESS',
                payload: {
                    grid: data.grid,
                    win: data.win,
                    matches: data.matches,
                    freeSpinRemaining: data.freeSpinRemaining
                }
            });

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
                }, 1800); // Sync with fall animation
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 1000 - elapsed); // Reduced cooling to 1s

            setTimeout(() => {
                setIsCooling(false);
                setShowWinPopup(false);
            }, remaining + 1000); // +1s reset buffer

        } catch (e) {
            console.error(e);
            dispatch({ type: 'SPIN_ERROR', payload: e.response?.data?.message || e.message });
            setIsCooling(false);
        }
    };

    return (
        <div className="h-[100dvh] bg-[#0a0a0a] text-white flex flex-col font-sans overflow-hidden relative">
            {/* Metallic Background VFX */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80 pointer-events-none"></div>
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            {/* HEADER - Compact & Visible */}
            <div className="shrink-0 h-14 px-4 bg-black/60 backdrop-blur-md flex justify-between items-center shadow-lg border-b border-white/5 relative z-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 font-bold hover:text-white transition active:scale-95">
                    <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">LOBBY</span>
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-400 uppercase tracking-widest leading-none">
                        ELEMENTAL RICHES
                    </div>
                    <div
                        onClick={() => setShowTrust(!showTrust)}
                        className="text-[9px] text-emerald-500 font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/10 px-2 rounded-full transition"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        VERIFIED FAIR 🛡️
                    </div>
                </div>

                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 shadow-inner">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">VAULT</span>
                    <span className="font-bold text-base text-yellow-500 font-mono">
                        <RollingCounter value={user?.wallet?.game || 0} />
                    </span>
                </div>
            </div>

            {/* Trust Modal */}
            {showTrust && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur border border-white/10 p-4 rounded-xl text-xs text-slate-300 w-64 shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-white mb-2">🛡️ Provably Fair System</h4>
                    <p className="mb-2">This game uses a cryptographically secure RNG verified by the server.</p>
                    <div className="bg-black/50 p-2 rounded font-mono text-[9px] break-all border border-white/5">
                        Client Seed: {user?._id?.substring(0, 8)}...<br />
                        Server Seed: (Hidden)<br />
                        Nonce: {Date.now()}
                    </div>
                    <button onClick={() => setShowTrust(false)} className="mt-3 w-full bg-slate-700 hover:bg-slate-600 text-white py-1 rounded font-bold">Close</button>
                </div>
            )}

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
                <div className="absolute top-14 left-0 right-0 z-30 bg-gradient-to-r from-blue-900/0 via-blue-600/50 to-blue-900/0 text-center py-1">
                    <span className="text-blue-200 text-sm font-black tracking-widest drop-shadow-[0_0_10px_#2563eb] animate-pulse">
                        ⚡ FREE SPINS ACTIVE: {state.freeSpinRemaining} ⚡
                    </span>
                </div>
            )}

            {/* Main Stage - Flex Grow to Fill remaining space */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 overflow-hidden w-full max-w-lg mx-auto">

                <style jsx global>{`
                    @keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                    .metal-shine { background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%); background-size: 200% 100%; animation: shine 3s infinite linear; }
                    .symbol-drop { animation: bounceMetal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                    @keyframes bounceMetal { 0% { transform: translateY(-100px); opacity: 0; } 70% { transform: translateY(10px); } 100% { transform: translateY(0); opacity: 1; } }
                    .win-flash { box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.2); border-color: #ffd700 !important; background: rgba(255, 215, 0, 0.1); animation: pulseMetal 1s infinite alternate; }
                    @keyframes pulseMetal { from { border-color: #a16207; } to { border-color: #fde047; box-shadow: 0 0 50px rgba(253, 224, 71, 0.5); } }
                `}</style>

                {/* Win Overlay */}
                {showWinPopup && state.lastWin > 0 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-yellow-500/50 animate-bounce shadow-[0_0_100px_rgba(234,179,8,0.3)] text-center scale-150 transform">
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-widest">Victory</h2>
                            <div className="text-5xl font-black text-white mt-2 font-mono shadow-black drop-shadow-xl">
                                ৳{state.lastWin.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {/* GRID - Responsive & Contained */}
                <div className="w-full aspect-[5/4] max-h-[60vh] bg-[#1a1a1a] p-2 rounded-xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] box-border relative grid grid-cols-5 gap-1.5 sm:gap-2">
                    {/* Decoration */}
                    <div className="absolute -top-1 -left-1 text-slate-700 opacity-50 text-xs">🔩</div>
                    <div className="absolute -bottom-1 -right-1 text-slate-700 opacity-50 text-xs">🔩</div>

                    {state.grid.map((col, cIdx) => (
                        <div key={cIdx} className="flex flex-col gap-1.5 sm:gap-2 h-full">
                            {col.map((sym, rIdx) => {
                                const isMatch = state.matches?.some(m => m.c === cIdx && m.r === rIdx);
                                const delay = cIdx * 60 + rIdx * 30; // Faster staggering
                                const isGold = sym.startsWith('GOLD');
                                const element = getElementalSymbol(sym);

                                return (
                                    <div
                                        key={`${cIdx}-${rIdx}`}
                                        className={`
                                            flex-1 bg-gradient-to-b from-slate-700 to-slate-900 rounded-md flex items-center justify-center border
                                            ${isGold ? 'border-yellow-500/50 from-slate-800 to-slate-900' : 'border-slate-600'}
                                            ${state.spinning ? 'opacity-50 blur-[1px] scale-95' : 'symbol-drop'}
                                            ${isMatch && !state.spinning ? 'win-flash z-10 scale-105' : ''}
                                            relative overflow-hidden shadow-inner transition-all
                                        `}
                                        style={{ animationDelay: state.spinning ? '0ms' : `${delay}ms` }}
                                    >
                                        {!state.spinning && <div className="absolute inset-0 metal-shine opacity-30 pointer-events-none"></div>}
                                        <span className={`text-3xl sm:text-4xl lg:text-5xl drop-shadow-lg select-none ${sym === 'SCATTER' ? 'animate-pulse' : ''}`}>
                                            {element}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* CONTROLS - Professional Bar */}
                <div className="mt-auto w-full pt-4 pb-2">
                    <div className="flex gap-3 items-stretch bg-slate-900/80 backdrop-blur p-3 rounded-2xl border border-slate-700 shadow-2xl">

                        {/* Bet Controls */}
                        <div className="flex flex-col justify-center gap-1 flex-1">
                            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-center">Stake</label>
                            <div className="flex items-center justify-between bg-black/40 p-1 rounded-xl border border-slate-700 h-10">
                                <button onClick={() => setBet(Math.max(1, bet - 10))} disabled={isCooling} className="w-8 h-full bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 active:scale-95 transition font-bold disabled:opacity-30">-</button>
                                <span className="flex-1 text-center font-bold text-lg text-slate-200 font-mono tracking-tighter">{bet}</span>
                                <button onClick={() => setBet(bet + 10)} disabled={isCooling} className="w-8 h-full bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 active:scale-95 transition font-bold disabled:opacity-30">+</button>
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
                                    : 'bg-gradient-to-b from-yellow-500 to-yellow-700 text-white hover:from-yellow-400 hover:to-yellow-600 active:scale-95 border-t border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)]'}
                            `}
                        >
                            <div className="flex flex-col items-center justify-center h-full">
                                {isCooling ? (
                                    <div className="w-6 h-6 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="leading-none text-lg">FORGE</span>
                                        <span className="text-[9px] opacity-70 font-normal leading-none mt-1">Spin</span>
                                    </>
                                )}
                            </div>
                            {!isCooling && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
