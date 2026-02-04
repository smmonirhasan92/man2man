'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function WinMessageOverlay({ winAmount, isBigWin }) {
    return (
        <AnimatePresence>
            {winAmount > 0 && (
                <motion.div
                    key="win-overlay"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                >
                    <div className={`
                        relative px-12 py-8 rounded-[2rem] border-4 shadow-2xl flex flex-col items-center justify-center
                        ${isBigWin
                            ? 'bg-gradient-to-br from-yellow-600 to-yellow-900 border-[#fcd34d] shadow-[0_0_50px_rgba(252,211,77,0.6)]'
                            : 'bg-black/80 backdrop-blur-xl border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]'}
                    `}>
                        {/* Background Flash */}
                        <div className="absolute inset-0 bg-white/10 animate-pulse rounded-[1.8rem]"></div>

                        <h2 className={`
                            text-2xl font-black tracking-[0.2em] uppercase mb-2
                            ${isBigWin ? 'text-[#fcd34d]' : 'text-emerald-400'}
                        `}>
                            {isBigWin ? "Big Win!" : "You Win"}
                        </h2>

                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">৳</span>
                            <span className={`text-6xl font-black text-white drop-shadow-md ${isBigWin ? 'animate-bounce' : ''}`}>
                                {winAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
