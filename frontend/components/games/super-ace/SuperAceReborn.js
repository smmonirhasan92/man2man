'use client';
import { useState, useReducer, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RollingCounter from './RollingCounter';
import Card from './Card'; // [NEW] Premium Card Component
import VaultWidget from './VaultWidget'; // [NEW] Vault Component
import toast from 'react-hot-toast';

// Initial State
const initialState = {
    grid: Array(5).fill(Array(4).fill('?')),
    spinning: false,
    lastWin: 0,
    matches: [],
    freeSpinRemaining: 0,
    error: null
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'SPIN_START':
            return { ...state, spinning: true, error: null, lastWin: 0, matches: [] };
        case 'SPIN_SUCCESS':
            return {
                ...state,
                spinning: false,
                grid: action.payload.grid,
                lastWin: action.payload.win,
                matches: action.payload.matches || [],
                freeSpinRemaining: action.payload.freeSpinRemaining,
                isScatter: action.payload.isScatter
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

    // [MADNESS VISUALS]
    const [shake, setShake] = useState(false);
    const [flashRed, setFlashRed] = useState(false);
    const [floatElements, setFloatElements] = useState([]); // { id, text, type, x, y }
    const [vaultData, setVaultData] = useState(null); // [NEW] Local vault state

    // Sync vaultData from user state on load
    useEffect(() => {
        if (user?.wallet) {
            setVaultData({
                locked: user.wallet.game_locked || 0,
                required: user.wallet.turnover?.required || 0,
                completed: user.wallet.turnover?.completed || 0
            });
        }
    }, [user]);

    // Sound Refs (Placeholder for future audio)
    const audioContextRef = useRef(null);

    // Spawning Floating Text
    const spawnFloat = (text, type) => {
        const id = Date.now();
        // Random slight position offset
        const x = 40 + Math.random() * 20; // 40-60% width
        const y = 40 + Math.random() * 10; // 40-50% height
        setFloatElements(prev => [...prev, { id, text, type, x, y }]);
        setTimeout(() => setFloatElements(prev => prev.filter(e => e.id !== id)), 1500);
    };

    const handleSpin = async () => {
        if (state.spinning || isCooling) return;
        if (!user) return toast.error("Please Login to Play");

        setIsCooling(true);
        setShowWinPopup(false);
        setShake(false);
        dispatch({ type: 'SPIN_START' });

        const startTime = Date.now();

        try {
            const { data } = await api.post('/game/super-ace/spin', { betAmount: bet });

            // [VISUAL IMPACT]
            setShake(true); // Shake on results landing
            setTimeout(() => setShake(false), 400);

            dispatch({
                type: 'SPIN_SUCCESS',
                payload: {
                    grid: data.grid,
                    win: data.win,
                    matches: data.matches,
                    freeSpinRemaining: data.freeSpinsLeft,
                    isScatter: data.isScatter
                }
            });

            // Delay for dramatic sync
            setTimeout(() => {
                // Update Balance & Vault
                setUser(prev => ({
                    ...prev,
                    game_balance: data.balance,
                    wallet: {
                        ...prev.wallet,
                        game: data.balance,
                        main: data.wallet_balance,
                        game_locked: data.vault?.locked ?? prev.wallet.game_locked,
                        turnover: {
                            required: data.vault?.required ?? prev.wallet.turnover?.required,
                            completed: data.vault?.completed ?? prev.wallet.turnover?.completed
                        }
                    }
                }));

                // Sync Local Vault Data for Widget
                if (data.vault) {
                    setVaultData({
                        locked: data.vault.locked,
                        required: data.vault.required,
                        completed: data.vault.completed
                    });
                }

                // [MADNESS LOGIC]
                if (data.win === 0) {
                    // LOSS: Fast Red Flash & Damage Text
                    setFlashRed(true);
                    setTimeout(() => setFlashRed(false), 300);
                    spawnFloat(`-৳${bet}`, 'damage');
                } else {
                    // Check if Trapped
                    if (data.vault?.trappedAmount > 0) {
                        spawnFloat(`🔒 TRAPPED ৳${data.vault.trappedAmount}`, 'damage'); // Trapped logic
                        toast("BIG WIN SECURED IN VAULT!", {
                            icon: '🔒',
                            style: { borderRadius: '10px', background: '#333', color: '#ffd700', border: '1px solid #ffd700' }
                        });
                    } else if (data.win > 0) {
                        spawnFloat(`+৳${data.win}`, 'win');
                    }
                }

                // Check Release
                if (data.vault?.wasReleased) {
                    toast.success(`VAULT UNLOCKED! ৳${data.vault.releasedAmount} RELEASED!`, {
                        duration: 5000,
                        icon: '🔓',
                        style: { background: '#064e3b', color: '#fff', border: '1px solid #34d399' }
                    });
                    // Explosion Effect could go here
                }

                // Win Popup Logic
                const isBigWin = data.win >= (bet * 5);
                if (isBigWin || data.isScatter) {
                    setShowWinPopup(true);
                }
            }, 500); // 500ms delay for "reel stop" visual feel

            // Cooldown Management
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 1500 - elapsed); // Faster 1.5s Cycle

            setTimeout(() => {
                setIsCooling(false);
                if (!data.isScatter && data.win < (bet * 5)) setShowWinPopup(false);
            }, remaining);

        } catch (e) {
            console.error(e);
            dispatch({ type: 'SPIN_ERROR', payload: e.response?.data?.message || e.message });
            setIsCooling(false);
            toast.error("Spin Failed");
        }
    };

    return (
        <div className={`
            min-h-[100dvh] bg-[#001219] text-white flex flex-col font-sans relative overflow-hidden
            ${shake ? 'animate-shake' : ''}
        `}>
            {/* [MADNESS] Red Flash Layer */}
            {flashRed && <div className="animate-flash-red"></div>}

            {/* Background VFX */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black opacity-80 pointer-events-none"></div>

            {/* Floating Elements Layer */}
            {floatElements.map(el => (
                <div
                    key={el.id}
                    className={`absolute z-50 text-4xl ${el.type === 'damage' ? 'animate-float-damage' : 'animate-float-win'}`}
                    style={{ left: `${el.x}%`, top: `${el.y}%` }}
                >
                    {el.text}
                </div>
            ))}

            {/* HEADER */}
            <div className="shrink-0 h-14 px-4 bg-black/60 backdrop-blur-md flex justify-between items-center shadow-lg border-b border-white/5 relative z-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-300 font-bold hover:text-white transition active:scale-95">
                    <ArrowLeft className="w-5 h-5" /> LOBBY
                </button>

                <div className="flex flex-col items-center">
                    <div className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-purple-400 uppercase tracking-widest leading-none drop-shadow-md">
                        SUPER ACE <span className="text-yellow-400 text-xs block text-center not-italic tracking-normal">REBORN</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 shadow-inner group">
                    <span className="text-[10px] text-slate-500 font-bold uppercase group-hover:text-yellow-500 transition-colors">
                        {user?.wallet?.game_locked > 0 ? '🔒 VAULT' : 'VAULT'}
                    </span>
                    <span className={`font-bold text-base font-mono ${user?.wallet?.game_locked > 0 ? 'text-red-400' : 'text-yellow-500'}`}>
                        <RollingCounter value={user?.wallet?.game || 0} />
                    </span>
                </div>
            </div>

            {/* ERROR BANNER */}
            {state.error && (
                <div className="absolute top-16 inset-x-0 z-40 flex justify-center pointer-events-none">
                    <div className="bg-red-900/90 text-white border border-red-500 px-6 py-2 rounded-full text-sm font-bold shadow-xl animate-bounce">
                        {state.error}
                    </div>
                </div>
            )}

            {/* FREE SPIN BANNER */}
            {state.freeSpinRemaining > 0 && (
                <div className="absolute top-14 left-0 right-0 z-30 bg-purple-900/80 text-center py-2 border-y border-purple-500/50 backdrop-blur-sm">
                    <span className="text-white text-lg font-black tracking-widest drop-shadow-[0_0_10px_#a855f7] animate-pulse">
                        ⚡ FREE SPINS: {state.freeSpinRemaining} ⚡
                    </span>
                </div>
            )}

            {/* VAULT WIDGET (Shows only if locked > 0) */}
            <div className="relative z-30 px-4 -mb-2 mt-2">
                <VaultWidget
                    lockedAmount={vaultData?.locked || user?.wallet?.game_locked || 0}
                    requiredTurnover={vaultData?.required || user?.wallet?.turnover?.required || 0}
                    completedTurnover={vaultData?.completed || user?.wallet?.turnover?.completed || 0}
                    onClaim={handleSpin}
                />
            </div>

            {/* MAIN STAGE */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 w-full max-w-lg mx-auto">

                {/* Win Overlay Popup */}
                {showWinPopup && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-xl p-8 rounded-2xl border-2 border-yellow-500 animate-bounce shadow-[0_0_100px_rgba(234,179,8,0.5)] text-center scale-110 transform">
                            {state.lastWin >= (bet * 5) ? (
                                <>
                                    <h2 className="text-4xl font-black text-yellow-400 uppercase tracking-widest animate-pulse">🌟 BIG WIN 🌟</h2>
                                    <div className="text-6xl font-black text-white mt-4 font-mono drop-shadow-[0_4px_0_#ca8a04]">
                                        ৳{state.lastWin.toFixed(2)}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-black text-purple-400 uppercase tracking-widest animate-pulse">💎 FEATURE 💎</h2>
                                    <div className="text-xl font-bold text-white mt-2">10 FREE SPINS!</div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* GRID */}
                <div className={`
                    w-full aspect-[5/4] max-h-[60vh] bg-slate-950/80 p-2 sm:p-3 rounded-2xl border border-slate-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] relative grid grid-cols-5 gap-1.5 sm:gap-2
                    ${state.lastWin > 0 ? 'animate-pulse-gold ring-1 ring-yellow-500/30' : ''}
                `}>
                    {/* Felt / Grid Texture */}
                    <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>

                    {state.grid.map((col, cIdx) => (
                        <div key={cIdx} className="flex flex-col gap-1.5 sm:gap-2 h-full z-10">
                            {col.map((sym, rIdx) => {
                                const isMatch = state.matches?.some(m => m.c === cIdx && m.r === rIdx);
                                // Card component handles parsing "GOLD_" etc.
                                return (
                                    <div
                                        key={`${cIdx}-${rIdx}`}
                                        className={`
                                            flex-1 relative transition-all duration-300
                                            ${state.spinning ? 'translate-y-[-100px] opacity-0' : 'translate-y-0 opacity-100'} 
                                            ${isMatch ? 'scale-105 z-20 brightness-110 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
                                        `}
                                        style={{ transitionDelay: `${cIdx * 50 + rIdx * 30}ms` }}
                                    >
                                        <Card
                                            symbol={sym}
                                            className={state.spinning ? 'blur-[2px]' : ''}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* CONTROLS */}
                <div className="mt-auto w-full pt-4 px-4 pb-[90px] relative z-20">
                    <div className="flex flex-col gap-4">
                        {/* Bet Controls */}
                        <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-xl">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2">Total Bet</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setBet(Math.max(10, bet - 10))} disabled={isCooling} className="btn-control">-</button>
                                <span className="w-20 text-center font-black text-2xl text-yellow-400 font-mono tracking-tighter bg-black/50 rounded-lg py-1">
                                    {bet}
                                </span>
                                <button onClick={() => setBet(bet + 10)} disabled={isCooling} className="btn-control">+</button>
                            </div>
                        </div>

                        {/* Spin Button */}
                        <button
                            onClick={handleSpin}
                            disabled={isCooling}
                            className={`
                                w-full h-20 rounded-2xl font-black text-3xl italic uppercase tracking-widest transition-all relative overflow-hidden group shadow-[0_10px_40px_-10px_rgba(168,85,247,0.6)]
                                flex flex-col items-center justify-center gap-1
                                ${isCooling
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                    : 'bg-gradient-to-b from-purple-600 via-purple-700 to-purple-900 text-white hover:scale-[1.02] active:scale-[0.98] border-t-2 border-purple-400'}
                            `}
                        >
                            <span className="relative z-10 drop-shadow-md">{isCooling ? '...' : 'SPIN'}</span>
                            {!isCooling && <span className="text-[10px] opacity-60 font-normal tracking-normal relative z-10">TAP TO PLAY</span>}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </button>
                    </div>
                </div>

            </div>

            {/* Custom Control Button Style */}
            <style jsx>{`
                .btn-control {
                    @apply w-12 h-10 bg-slate-800 text-white rounded-xl active:scale-95 transition flex items-center justify-center text-xl font-bold shadow-lg border border-white/5;
                }
            `}</style>
        </div>
    );
}
