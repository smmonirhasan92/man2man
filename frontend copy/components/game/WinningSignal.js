'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function WinningSignal({ totalWin }) {
    if (totalWin <= 0) return null;

    // Generate coins based on win amount (capped for performance)
    const coinCount = Math.min(Math.floor(totalWin / 10) + 5, 20);
    const coins = Array.from({ length: coinCount }, (_, i) => i);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            <AnimatePresence>
                {coins.map((i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 100, scale: 0.5 }}
                        animate={{
                            opacity: [0, 1, 0],
                            y: -200 - Math.random() * 100,
                            x: (Math.random() - 0.5) * 100,
                            rotate: Math.random() * 360,
                            scale: Math.random() * 0.5 + 0.8
                        }}
                        transition={{
                            duration: 1.5,
                            ease: "easeOut",
                            delay: Math.random() * 0.5
                        }}
                        className="absolute bottom-10 left-1/2 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-[0_0_15px_rgba(253,224,71,0.6)] flex items-center justify-center text-[10px] font-black text-yellow-800"
                        style={{ marginLeft: '-16px' }} // Center
                    >
                        $
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Central Pop-up Text */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-3xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] flex flex-col items-center">
                    <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Total Win</span>
                    <span className="text-4xl font-black text-white">৳{totalWin.toFixed(2)}</span>
                </div>
            </motion.div>
        </div>
    );
}
