import React, { useEffect, useState } from 'react';
import { Lock, Unlock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VaultWidget = ({ lockedAmount, requiredTurnover, completedTurnover, isSpinLock, remainingSpins, onClaim }) => {
    const [isHovered, setIsHovered] = useState(false);
    // Safety checks for NaN
    const safeReq = requiredTurnover || 0;
    const safeComp = completedTurnover || 0;
    const safeLocked = lockedAmount || 0;

    // Progress Logic
    let progress = 0;
    if (isSpinLock) {
        // Spin Lock Mode: Progress is based on (10 - remaining) / 10
        const spins = remainingSpins !== undefined ? remainingSpins : 10;
        progress = ((10 - spins) / 10) * 100;
    } else {
        // Amount Mode
        progress = safeReq > 0 ? Math.min((safeComp / safeReq) * 100, 100) : 0;
    }

    const isUnlocked = progress >= 100 && safeLocked > 0;

    if (safeLocked <= 0) return null; // Hide if empty

    return (
        <motion.div
            className={`relative flex items-center justify-center p-3 rounded-xl border shadow-[0_0_15px_rgba(234,179,8,0.3)] backdrop-blur-md transition-all duration-300 mx-auto my-2 max-w-sm
                ${isSpinLock ? 'bg-red-950/60 border-red-500/50' : 'bg-black/60 border-yellow-500/50'}
            `}
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Pulse if Locked */}
            {!isUnlocked && (
                <div className={`absolute inset-0 rounded-xl animate-pulse ${isSpinLock ? 'bg-red-500/5' : 'bg-yellow-500/5'}`} />
            )}

            {/* Icon Section */}
            <div className="mr-4 relative flex items-center justify-center">
                {isUnlocked ? (
                    <motion.div
                        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Unlock className="w-8 h-8 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    </motion.div>
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <Lock className={`w-8 h-8 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)] ${isSpinLock ? 'text-red-500' : 'text-yellow-500'}`} />
                    </motion.div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold text-sm tracking-widest uppercase ${isSpinLock ? 'text-red-400' : 'text-yellow-400'}`}>
                        {isSpinLock ? 'WIN LOCKED' : 'Vault Locked'}
                    </span>
                    <span className="text-white font-mono font-bold text-sm">৳{safeLocked.toFixed(2)}</span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600 shadow-inner">
                    <motion.div
                        className={`absolute left-0 top-0 h-full 
                            ${isUnlocked
                                ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                : isSpinLock
                                    ? 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400'
                                    : 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200'
                            }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                    <span>{progress.toFixed(0)}% {isSpinLock ? 'COMPLETE' : 'RELEASED'}</span>
                    {isSpinLock ? (
                        <span className="text-yellow-300 font-bold animate-pulse">
                            {remainingSpins} SPINS TO UNLOCK
                        </span>
                    ) : (
                        <span>TARGET: ৳{(safeReq - safeComp).toFixed(0)} LEFT</span>
                    )}
                </div>
            </div>

            {/* Claim Notification / Effect */}
            <AnimatePresence>
                {isUnlocked && (
                    <motion.div
                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold py-1 px-3 rounded-full shadow-lg border border-green-400 z-10 whitespace-nowrap"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 10, opacity: 0 }}
                    >
                        UNLOCKING ON NEXT SPIN...
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default VaultWidget;
