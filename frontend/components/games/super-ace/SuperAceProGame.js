'use client';
import { useState, useReducer, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { ArrowLeft, Activity, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RollingCounter from './RollingCounter';
import toast from 'react-hot-toast';

// [THEME] Cyberpunk / Trader Pro
// Colors: Neon Blue, Purple, Dark Grey, Data visualization elements

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

export default function SuperAceProGame() {
    const router = useRouter();
    const { user, setUser } = useAuth();
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [bet, setBet] = useState(10);
    const [isCooling, setIsCooling] = useState(false);

    // [PRO VISUALS]
    const [shake, setShake] = useState(false);
    const [floatElements, setFloatElements] = useState([]);
    const [turboMode, setTurboMode] = useState(false);

    // Spawning Floating Text
    const spawnFloat = (text, type) => {
        const id = Date.now();
        const x = 50 + (Math.random() - 0.5) * 20;
        const y = 50 + (Math.random() - 0.5) * 20;
        setFloatElements(prev => [...prev, { id, text, type, x, y }]);
        setTimeout(() => setFloatElements(prev => prev.filter(e => e.id !== id)), 1000); // Faster float
    };

    const handleSpin = async () => {
        if (state.spinning || isCooling) return;
        if (!user) return toast.error("Please Login");

        const cooldownTime = turboMode ? 800 : 1500;

        setIsCooling(true);
        setShake(false);
        dispatch({ type: 'SPIN_START' });

        const startTime = Date.now();

        try {
            const { data } = await api.post('/game/super-ace/spin', { betAmount: bet });

            setShake(true);
            setTimeout(() => setShake(false), 200); // Shorter shake for pro

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

            // Fast Balance Update
            setTimeout(() => {
                setUser(prev => ({
                    ...prev,
                    game_balance: data.balance,
                    wallet: { ...prev.wallet, game: data.balance, main: data.wallet_balance, game_locked: data.wallet_locked || prev.wallet.game_locked }
                }));

                if (data.win > 0) {
                    spawnFloat(`+${data.win.toFixed(1)}`, 'win');
                } else {
                    spawnFloat(`-${bet}`, 'damage');
                }

            }, turboMode ? 200 : 400);

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, cooldownTime - elapsed);

            setTimeout(() => {
                setIsCooling(false);
            }, remaining);

        } catch (e) {
            console.error(e);
            dispatch({ type: 'SPIN_ERROR', payload: e.response?.data?.message || e.message });
            setIsCooling(false);
        }
    };

    return (
        <div className={`
            min-h-screen bg-[#050B14] text-cyan-50 font-mono overflow-hidden flex flex-col relative
            ${shake ? 'translate-x-[-2px]' : ''}
        `}>
            {/* BACKGROUND GRID */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            {/* FLOAT LAYER */}
            {floatElements.map(el => (
                <div
                    key={el.id}
                    className={`absolute z-50 text-2xl font-black tracking-tighter ${el.type === 'damage' ? 'text-red-500 animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_1]' : 'text-cyan-400 animate-float-win'}`}
                    style={{ left: `${el.x}%`, top: `${el.y}%` }}
                >
                    {el.text}
                </div>
            ))}

            {/* HEADER */}
            <header className="h-12 border-b border-cyan-900/50 bg-[#020617]/90 backdrop-blur flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-cyan-600 hover:text-cyan-400 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-500" />
                        <span className="font-bold text-lg tracking-wider text-cyan-500">ACE<span className="text-white">PRO</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Vault Indicator */}
                    {user?.wallet?.game_locked > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-400 font-bold border border-red-900/50 px-2 py-1 rounded bg-red-950/20">
                            <ShieldCheck className="w-3 h-3" />
                            LOCKED: {user.wallet.game_locked.toFixed(2)}
                        </div>
                    )}

                    <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Balance</div>
                        <div className="font-mono text-xl text-cyan-400 leading-none">
                            ৳<RollingCounter value={user?.wallet?.game || 0} />
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN DATA GRID - Pro Layout */}
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative z-10 max-w-6xl mx-auto w-full items-center justify-center">

                {/* LEFT: Stats & Log (Desktop only usually, adapted for mobile as overlay or top bar) */}
                <div className="hidden md:flex flex-col gap-4 w-64 shrink-0">
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> RTP (Live)
                        </div>
                        <div className="text-2xl font-mono text-emerald-400">96.8%</div>
                        <div className="h-1 w-full bg-slate-800 mt-2 rounded-full overflow-hidden">
                            <div className="h-full w-[96%] bg-emerald-500"></div>
                        </div>
                    </div>
                    {/* Log placeholder */}
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex-1 font-mono text-xs text-slate-400 overflow-y-auto max-h-[400px]">
                        {state.lastWin > 0 ? (
                            <div className="text-emerald-400">&gt; WIN DETECTED: {state.lastWin.toFixed(2)}</div>
                        ) : state.spinning ? (
                            <div className="animate-pulse">&gt; EXECUTING SPIN...</div>
                        ) : (
                            <div>&gt; SYSTEM READY</div>
                        )}
                        <div className="mt-2 text-slate-600">&gt; User ID: {user?.customId}</div>
                        <div className="text-slate-600">&gt; Session: ACTIVE</div>
                    </div>
                </div>

                {/* CENTER: The Matrix (Grid) */}
                <div className="relative">
                    {/* Decorators */}
                    <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/20 to-purple-500/20 rounded-lg blur-sm"></div>

                    <div className="relative bg-[#020617] border border-cyan-500/30 p-1 rounded-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                        <div className="grid grid-cols-5 gap-[1px] bg-cyan-900/20 w-[90vw] md:w-[500px] aspect-[5/4]">
                            {state.grid.map((col, cIdx) => (
                                <div key={cIdx} className="flex flex-col gap-[1px]">
                                    {col.map((sym, rIdx) => {
                                        const isMatch = state.matches?.some(m => m.c === cIdx && m.r === rIdx);
                                        const isGold = sym.startsWith('GOLD');
                                        // Simplify visuals for PRO mode (Symbols/Text centered)
                                        const displaySym = sym.replace('GOLD_', '').replace('SCATTER', 'S').replace('WILD', 'W');

                                        return (
                                            <div key={`${cIdx}-${rIdx}`} className={`
                                                flex-1 bg-slate-900 flex items-center justify-center relative overflow-hidden group
                                                ${isMatch ? 'bg-cyan-950 shadow-[inset_0_0_20px_rgba(6,182,212,0.5)]' : ''}
                                            `}>
                                                <div className={`
                                                    text-2xl md:text-4xl font-black font-mono z-10
                                                    ${isGold ? 'text-yellow-400' : 'text-slate-500 group-hover:text-slate-200'}
                                                    ${sym.includes('SCATTER') ? 'text-purple-400' : ''}
                                                    ${sym.includes('WILD') ? 'text-pink-500' : ''}
                                                `}>
                                                    {displaySym}
                                                </div>
                                                {/* Scanline effect */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 bg-[length:100%_200%] animate-scan"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BOTTOM/RIGHT: Controls */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-lg flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                            <label className="text-xs text-slate-500 font-bold">BET AMOUNT</label>
                            <input className="bg-transparent text-right font-mono text-xl text-white w-24 outline-none border-b border-slate-700 focus:border-cyan-500 transition-colors"
                                value={bet} readOnly />
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                            {[10, 20, 50, 100].map(amt => (
                                <button key={amt} onClick={() => setBet(amt)}
                                    className={`py-1 text-xs font-mono border ${bet === amt ? 'border-cyan-500 text-cyan-500 bg-cyan-950/30' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                                    {amt}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">TURBO MODE</span>
                            <button onClick={() => setTurboMode(!turboMode)}
                                className={`w-8 h-4 rounded-full transition-colors relative ${turboMode ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${turboMode ? 'left-4.5' : 'left-0.5'}`}></div>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSpin}
                        disabled={isCooling}
                        className={`
                            h-16 w-full rounded bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 text-black font-black text-xl tracking-widest transition-all clip-path-polygon
                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                        `}
                        style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                        {isCooling ? <Activity className="animate-spin" /> : <Zap className="fill-current" />}
                        {isCooling ? 'EXECUTING' : 'INITIATE'}
                    </button>

                    {/* Win Popup - Pro Style (Minimal Toast/Overlay in specific area) */}
                    {state.lastWin > 0 && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-50">
                            {/* Only blocking click if big win? No, kept strictly visual */}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                @keyframes scan {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 0% 200%; }
                }
            `}</style>
        </div>
    );
}
