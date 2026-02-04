'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, ShieldCheck, Repeat, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Card from './Card'; // Reusing or wrapping existing Card
import GameBalanceDisplay from '../../game/GameBalanceDisplay';
import LiveWinMarquee from '../../game/LiveWinMarquee';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

// --- VISUAL CONSTANTS ---
const THEME = {
    bg: "bg-[#1e1b4b]", // Royal Purple (Indigo 950 base)
    accent: "text-[#FFD700]",
    border: "border-[#FFD700]",
    glow: "shadow-[0_0_20px_rgba(255,215,0,0.4)]"
};

export default function SuperAceContainer() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    // --- STATE ---
    const [grid, setGrid] = useState(generateEmptyGrid());
    const [bet, setBet] = useState(10);
    const [spinning, setSpinning] = useState(false);
    const [multiplier, setMultiplier] = useState(1);
    const [winInfo, setWinInfo] = useState({ total: 0, lastWin: 0 });
    const [winningIndices, setWinningIndices] = useState([]); // For explosion effect

    // --- LOGIC ---
    function generateEmptyGrid() {
        return Array(5).fill(null).map(() => Array(4).fill(null));
        // We'll fill with symbols: { id: unique, symbol: 'A', isGold: false }
    }

    const spin = async () => {
        if (spinning) return;
        setSpinning(true);
        setWinningIndices([]);
        setMultiplier(1);
        setWinInfo({ total: 0, lastWin: 0 });

        try {
            // 1. Simulate API or Real Call
            // const { data } = await api.post('/game/super-ace/spin', { betAmount: bet });
            // Using logic stub for now to demonstrate Animation

            // Phase 1: New Grid enters
            const newGrid = Array(5).fill(0).map((_, col) =>
                Array(4).fill(0).map((_, row) => generateRandomCard(col, row))
            );

            setGrid(newGrid);

            // Phase 2: Wait for Drop (handled by layout animation variants)
            await new Promise(r => setTimeout(r, 1000));

            // Phase 3: Check Wins & Cascade (Simulation)
            // If API not ready, we skip cascade or simulate one step
            // simulateCascade(newGrid); 

        } catch (e) {
            console.error("Spin failed", e);
        } finally {
            setSpinning(false);
            if (typeof refreshUser === 'function') refreshUser();
        }
    };

    function generateRandomCard(col, row) {
        const syms = ['J', 'Q', 'K', 'A', '10', '9'];
        const isGold = Math.random() > 0.8;
        return {
            id: `card-${col}-${row}-${Date.now()}-${Math.random()}`, // Unique ID for AnimatePresence
            symbol: isGold ? 'GOLD_' + syms[Math.floor(Math.random() * syms.length)] : syms[Math.floor(Math.random() * syms.length)],
            col,
            row
        };
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2e1065] via-[#0f172a] to-[#020617] text-white font-sans overflow-hidden flex flex-col relative settings-premium">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "url('/assets/pattern-royal.svg')", backgroundSize: '200px' }}>
            </div>

            <LiveWinMarquee />

            {/* HEADER */}
            <header className="px-4 py-3 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                        <ChevronLeft className="w-6 h-6 text-[#FFD700] group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black italic tracking-widest text-[#FFD700] uppercase drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)] flex items-center gap-2">
                            <Crown className="w-5 h-5 fill-current" />
                            SUPER ACE
                        </h1>
                        <span className="text-[10px] text-purple-200 font-bold tracking-widest uppercase opacity-70">Premium Edition</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* QUICK WALLET DISPLAY */}
                    <div className="flex items-center gap-2 bg-black/60 rounded-full px-4 py-1.5 border border-[#FFD700]/30 shadow-inner backdrop-blur-md">
                        <div className="flex flex-col items-end leading-none">
                            <span className="text-[10px] text-[#FFD700] font-bold uppercase tracking-widest">Quick Wallet</span>
                            <span className="text-sm font-black text-white">৳{(user?.game_balance || 0).toLocaleString()}</span>
                        </div>
                        {/* Quick Deposit Button if Low Balance */}
                        {(user?.game_balance || 0) < bet && (
                            <button
                                onClick={() => document.getElementById('quick-deposit-btn')?.click()} // Trigger hidden button or use context
                                className="bg-[#FFD700] text-black text-[10px] font-bold px-2 py-1 rounded hover:bg-yellow-400 transition animate-pulse"
                            >
                                + DEPOSIT
                            </button>
                        )}
                        <GameBalanceDisplay showLabel={false} /> {/* Reuse existing for modal trigger */}
                    </div>
                </div>
            </header>

            {/* GAME AREA */}
            <main className="flex-1 flex flex-col items-center justify-center p-2 relative z-10 w-full max-w-lg mx-auto lg:max-w-2xl">

                {/* 1. Multiplier Bar (Neon Glow) */}
                <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 mb-6 border border-white/10 flex gap-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent w-full h-full animate-[pulse_3s_ease-in-out_infinite]"></div>
                    {[1, 2, 3, 5, 10].map((m) => {
                        const active = multiplier >= m;
                        const current = multiplier === m;
                        return (
                            <div key={m} className={`relative z-10 flex flex-col items-center transition-all duration-500 ${current ? 'scale-125' : 'scale-100 opacity-50'}`}>
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all
                                    ${current
                                        ? 'bg-[#FFD700] border-white text-black shadow-[0_0_20px_#FFD700]'
                                        : 'bg-transparent border-slate-600 text-slate-400'}
                                `}>
                                    x{m}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 2. Game Grid (Royal Frame) */}
                <div className="relative p-1 rounded-[24px] bg-gradient-to-b from-[#FFD700] via-[#B8860B] to-[#FFD700] shadow-[0_0_50px_rgba(107,33,168,0.5)]">
                    <div className="bg-[#1e1b4b] rounded-[20px] p-2 relative overflow-hidden border-4 border-[#0f172a]">

                        {/* Grid Inner */}
                        <div className="grid grid-cols-5 gap-1.5 w-[85vw] max-w-[400px] aspect-[5/4] relative">
                            {/* Columns */}
                            {grid.map((colCards, colIdx) => (
                                <div key={colIdx} className="flex flex-col gap-1.5 relative">
                                    <AnimatePresence>
                                        {colCards.map((cardData, rowIdx) => {
                                            const isWinning = winningIndices.includes(`${colIdx}-${rowIdx}`);

                                            // Animation Variants
                                            const variants = {
                                                hidden: { y: -400 - (rowIdx * 100), opacity: 0, scale: 0.8, rotateX: 20 },
                                                visible: {
                                                    y: 0, opacity: 1, scale: 1, rotateX: 0,
                                                    transition: {
                                                        type: "spring",
                                                        damping: 12,
                                                        stiffness: 100,
                                                        delay: (colIdx * 0.1) + (rowIdx * 0.05) // Waterfall Stagger
                                                    }
                                                },
                                                exit: {
                                                    scale: 1.5, opacity: 0, filter: 'brightness(2)',
                                                    transition: { duration: 0.3 }
                                                }
                                            };

                                            return (
                                                <motion.div
                                                    key={cardData?.id || `${colIdx}-${rowIdx}-empty`}
                                                    variants={variants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    className="relative aspect-[3/4] z-10"
                                                    style={{
                                                        zIndex: rowIdx, // Layering
                                                        perspective: '1000px'
                                                    }}
                                                >
                                                    {cardData ? (
                                                        <Card
                                                            symbol={cardData.symbol}
                                                            isGold={cardData.symbol.includes('GOLD_')}
                                                            isWild={cardData.symbol === 'WILD'}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 rounded-lg border border-white/5" />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Controls (Bottom) */}
                <div className="mt-8 w-full flex items-center gap-4 bg-[#0f172a]/80 p-4 rounded-3xl border border-white/5 backdrop-blur-md shadow-xl">
                    <div className="flex-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Bet</div>
                        <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1">
                            <button onClick={() => setBet(Math.max(10, bet - 10))} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold">-</button>
                            <div className="flex-1 text-center font-black text-xl text-[#FFD700]">৳{bet}</div>
                            <button onClick={() => setBet(bet + 10)} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold">+</button>
                        </div>
                    </div>

                    <button
                        onClick={spin}
                        disabled={spinning}
                        className={`
                            h-16 px-8 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all
                            ${spinning
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]'}
                        `}
                    >
                        {spinning ? <Repeat className="animate-spin" /> : <Zap fill="black" />}
                        {spinning ? 'Running...' : 'SPIN'}
                    </button>
                </div>

                {winInfo.total > 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1.5, rotate: 0 }}
                            className="text-6xl font-black text-[#FFD700] drop-shadow-[0_0_10px_black] stroke-black"
                            style={{ WebkitTextStroke: '2px black' }}
                        >
                            BIG WIN!
                        </motion.div>
                    </div>
                )}

            </main>
        </div>
    );
}
