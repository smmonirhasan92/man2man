'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Repeat, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import Card from './Card';
import GameBalanceDisplay from '../../game/GameBalanceDisplay';
import LiveWinMarquee from '../../game/LiveWinMarquee';
import GameLog from '../../game/GameLog';

// [ROLLBACK] Stable Classic Version
export default function SuperAceGame() {
    const router = useRouter();
    const [grid, setGrid] = useState(Array(5).fill(Array(4).fill(null)));
    const [bet, setBet] = useState(10);
    const [spinning, setSpinning] = useState(false);
    const [multiplier, setMultiplier] = useState(1);
    const [winInfo, setWinInfo] = useState({ total: 0, lastWin: 0 });
    const [gameLog, setGameLog] = useState({ message: 'Ready to Spin', type: 'info' });
    const [showWinPopup, setShowWinPopup] = useState(false); // [NEW] Popup State
    const [isFreeSpinMode, setIsFreeSpinMode] = useState(false); // [NEW] FS State

    // [MADNESS]
    const [shake, setShake] = useState(false);
    const [floatElements, setFloatElements] = useState([]);

    const SYMBOLS = ['J', 'Q', 'K', 'A'];

    useEffect(() => {
        setGrid(generateMockGrid());
    }, []);

    const generateMockGrid = () => {
        return Array(5).fill(0).map(() => Array(4).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * 4)]));
    };

    // Spawning Floating Text
    const spawnFloat = (text, type) => {
        const id = Date.now();
        const x = 40 + Math.random() * 20;
        const y = 40 + Math.random() * 10;
        setFloatElements(prev => [...prev, { id, text, type, x, y }]);
        setTimeout(() => setFloatElements(prev => prev.filter(e => e.id !== id)), 1500);
    };

    const spin = async () => {
        if (spinning) return;
        const startTime = Date.now();
        setSpinning(true);
        setWinInfo({ total: 0, lastWin: 0 });
        setMultiplier(1);
        setShowWinPopup(false);
        setGameLog({ message: 'Spinning...', type: 'info' });
        setShake(false);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            let data;
            try {
                const response = await api.post('/game/super-ace/spin', { betAmount: bet }, { signal: controller.signal });
                data = response.data;
            } catch (netErr) {
                if (netErr.name === 'AbortError' || netErr.api === 'CanceledError' || netErr.code === 'ERR_CANCELED') {
                    throw new Error('Server Timeout');
                }
                throw netErr;
            } finally {
                clearTimeout(timeoutId);
            }

            // [VISUAL IMPACT]
            setShake(true);
            setTimeout(() => setShake(false), 300);

            // Processing
            setGrid(data.grid);

            // Check for Free Spins logic
            if (data.isFreeGame) setIsFreeSpinMode(true);
            if (data.freeSpinsLeft === 0) setIsFreeSpinMode(false);

            if (data.totalWin > 0 || data.isFreeSpin) {
                setWinInfo({ total: data.totalWin, lastWin: data.totalWin });
                setGameLog({ message: `Win ৳${data.totalWin.toFixed(2)}`, type: 'win' });
                spawnFloat(`+৳${data.totalWin.toFixed(0)}`, 'win');

                // [WIN POPUP TRIGGER]
                if (data.totalWin >= (bet * 5) || data.isScatter) {
                    setTimeout(() => setShowWinPopup(true), 500);
                    setTimeout(() => setShowWinPopup(false), 3500);
                }

            } else {
                setGameLog({ message: "Try Again", type: 'loss' });
            }

        } catch (e) {
            console.error("Spin Error", e);
            setGameLog({ message: e.message || "Network Error", type: 'error' });
            spawnFloat("ERROR", 'damage');
        } finally {
            clearTimeout(timeoutId);
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
            setSpinning(false);
        }
    };

    return (
        <div className={`
            min-h-screen bg-[var(--bg-dark-primary)] text-white font-sans overflow-hidden flex flex-col relative
            ${shake ? 'animate-shake' : ''}
        `}>
            <LiveWinMarquee />

            {/* Floating Elements */}
            {floatElements.map(el => (
                <div
                    key={el.id}
                    className={`absolute z-50 text-4xl ${el.type === 'damage' ? 'animate-float-damage' : 'animate-float-win'}`}
                    style={{ left: `${el.x}%`, top: `${el.y}%` }}
                >
                    {el.text}
                </div>
            ))}

            <header className="p-4 flex justify-between items-center bg-[#03180f]/90 backdrop-blur-md border-b border-[#d4af37]/30 shadow-lg z-20">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition group">
                        <ArrowLeft className="w-5 h-5 text-[#d4af37] group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <h1 className="text-xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#fcd34d] uppercase drop-shadow-sm">
                        Super Ace
                    </h1>
                </div>
                <GameBalanceDisplay showLabel={false} />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-2 relative z-10">
                <GameLog message={gameLog.message} type={gameLog.type} />

                {/* Multipliers - Fixed Layout */}
                <div className="flex gap-4 mb-6">
                    {[1, 2, 3, 5].map(m => (
                        <div key={m} className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl border-2 transition-all duration-300
                            ${multiplier === m ? 'bg-[#d4af37] border-white text-[#3d1c10] scale-125 shadow-[0_0_15px_#d4af37]' : 'bg-[#062c1d]/60 border-[#d4af37]/30 text-[#d4af37]/50'}
                        `}>
                            x{m}
                        </div>
                    ))}
                </div>

                {/* Main Grid - Removed Double Border & Fixed Gap */}
                <div className="relative bg-[#03180f]/90 p-2 rounded-xl border border-[#d4af37] shadow-2xl">
                    <div className="grid grid-cols-5 gap-1.5 w-[94vw] max-w-lg aspect-[5/4] max-h-[50vh]">
                        {grid.map((col, colIdx) => (
                            <div key={colIdx} className="flex flex-col gap-1.5 h-full">
                                {col.map((symbol, rowIdx) => (
                                    <div key={`${colIdx}-${rowIdx}`} className="flex-1 rounded-lg overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-900/50 z-0"></div>
                                        <div className="relative z-10 h-full w-full">
                                            <Card symbol={symbol} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls - Premium Look */}
                <div className="w-full max-w-md mt-6 grid grid-cols-[1fr_auto] gap-4 bg-[#062c1d] p-4 rounded-3xl border border-[#d4af37]/20 shadow-2xl z-20">
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-[#d4af37]/70 font-bold uppercase mb-2 tracking-wider ml-1">Bet Amount</span>
                        <div className="flex items-center gap-2 bg-[#03180f] rounded-2xl p-1.5 border border-white/5">
                            <button onClick={() => setBet(Math.max(10, bet - 10))} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-[#d4af37] font-black text-lg transition">-</button>
                            <input className="bg-transparent text-center w-full font-black text-white text-lg outline-none" value={bet} readOnly />
                            <button onClick={() => setBet(bet + 10)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-[#d4af37] font-black text-lg transition">+</button>
                        </div>
                    </div>

                    <button
                        onClick={spin}
                        disabled={spinning}
                        className={`
                            h-20 w-20 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-[#d4af37]/50
                            ${spinning ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-gradient-to-br from-[#d4af37] to-[#8a6d1f] hover:brightness-110'}
                        `}
                    >
                        {spinning ? (
                            <Repeat className="w-8 h-8 text-white/50 animate-spin" />
                        ) : (
                            <Zap className="w-10 h-10 text-[#3d1c10] fill-current" />
                        )}
                    </button>
                </div>

                {/* WIN POPUP */}
                {showWinPopup && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/90 p-8 rounded-2xl border-2 border-[#d4af37] animate-bounce shadow-[0_0_80px_rgba(212,175,55,0.6)] text-center scale-125 backdrop-blur-sm">
                            <div className="text-3xl font-black text-[#d4af37] uppercase tracking-widest mb-2 animate-pulse">
                                {winInfo.lastWin >= (bet * 5) ? "🌟 SUPER WIN 🌟" : "💎 FREE GAMES 💎"}
                            </div>
                            {winInfo.lastWin > 0 && (
                                <div className="text-5xl font-black text-white font-mono drop-shadow-md">
                                    ৳{winInfo.lastWin.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
