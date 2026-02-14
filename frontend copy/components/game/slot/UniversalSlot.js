"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeAssets from './ThemeAssets';

// Helper for 'transform-gpu' and optimized rendering
const SlotReel = ({ assets, symbols, spinning, resultIndex, delay }) => {
    // If spinning, we show a blur or rapid transition
    // If result, we show the symbol

    // Simulating Reel Strip
    const strip = [...symbols, ...symbols, ...symbols]; // Repeats for loop illusion

    return (
        <div className={`relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center ${assets?.ui?.reel || 'bg-black/20 border border-white/5'}`}>
            <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ y: 0 }}
                animate={spinning ? { y: [0, -1000] } : { y: 0 }}
                transition={spinning ? {
                    repeat: Infinity,
                    duration: 0.5,
                    ease: "linear",
                    repeatType: "loop"
                } : {
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: delay
                }}
            >
                {/* Visual Trick: Just show result when stopped, else blur */}
                {!spinning ? (
                    <span className="text-4xl md:text-6xl drop-shadow-lg filter transform-gpu">
                        {symbols[resultIndex % symbols.length]}
                    </span>
                ) : (
                    // Blur Effect during Spin
                    <div className="flex flex-col gap-8 opacity-50 blur-sm">
                        {strip.map((s, i) => (
                            <span key={i} className="text-4xl">{s}</span>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default function UniversalSlot({
    theme = 'royale',
    onSpin,
    balance = 0,
    betAmount = 10
}) {
    const assets = ThemeAssets[theme] || ThemeAssets.royale;
    const [spinning, setSpinning] = useState(false);
    const [results, setResults] = useState([0, 0, 0, 0, 0]); // 5 Reels

    const handleSpin = async () => {
        if (spinning) return;
        setSpinning(true);

        // Trigger Backend
        try {
            const data = await onSpin(betAmount); // Expect { grid: [...], win: ... }
            if (data) {
                // Wait for animation (simulated delay for network + suspense)
                setTimeout(() => {
                    setSpinning(false);
                    // Update Results based on backend grid (simplified here for visual)
                    // Ideally map backend symbols to indices
                    setResults([
                        Math.floor(Math.random() * assets.symbols.length),
                        Math.floor(Math.random() * assets.symbols.length),
                        Math.floor(Math.random() * assets.symbols.length),
                        Math.floor(Math.random() * assets.symbols.length),
                        Math.floor(Math.random() * assets.symbols.length)
                    ]);
                }, 2000);
            }
        } catch (e) {
            console.error("Spin Failed", e);
            setSpinning(false);
        }
    };

    return (
        <div className={`w-full min-h-screen ${assets.background} flex flex-col items-center justify-center p-4 pb-24 md:pb-4`}>

            {/* Header */}
            <div className={`w-full max-w-4xl flex justify-between items-center mb-8 ${assets.ui.panel} p-4 rounded-xl`}>
                <h1 className={`text-2xl font-bold ${assets.primaryColor} uppercase tracking-wider`}>
                    {assets.name}
                </h1>
                <div className="flex gap-4 text-white">
                    <div>
                        <span className="text-xs opacity-70">Balance</span>
                        <div className={`font-mono text-xl ${assets.primaryColor || 'text-white'}`}>{balance.toFixed(2)}</div>
                    </div>
                    <div>
                        <span className="text-xs opacity-70">Bet</span>
                        <div className={`font-mono text-xl ${assets.primaryColor || 'text-yellow-400'}`}>{betAmount}</div>
                    </div>
                </div>
            </div>

            {/* Slot Machine Display */}
            <div className={`relative w-full max-w-4xl aspect-[16/9] md:aspect-[21/9] bg-black/40 rounded-2xl p-2 md:p-6 shadow-2xl backdrop-blur-xl ${assets.ui.panel || 'border-4 border-white/10'}`}>

                {/* Reels Grid */}
                <div className="grid grid-cols-5 gap-2 md:gap-4 h-full">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-full">
                            <SlotReel
                                assets={assets}
                                symbols={assets.symbols}
                                spinning={spinning}
                                resultIndex={results[i]}
                                delay={i * 0.1} // Cascade Stop
                            />
                        </div>
                    ))}
                </div>

                {/* Win Line Overlay (Example) */}
                <AnimatePresence>
                    {!spinning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 pointer-events-none flex items-center justify-center"
                        >
                            {/* Win Animations can go here */}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="mt-8 w-full max-w-md flex justify-center">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSpin}
                    disabled={spinning}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-xl font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed ${assets.ui.button} transition-colors duration-300 transform-gpu`}
                >
                    {spinning ? '...' : 'SPIN'}
                </motion.button>
            </div>

            {/* Bottom Nav Spacer for Mobile */}
            <div className="h-16 md:h-0"></div>
        </div>
    );
}
