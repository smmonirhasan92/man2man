'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function GameLog({ message, type = 'info' }) {
    return (
        <div className="w-full max-w-md mx-auto mt-2 h-8 relative overflow-hidden bg-black/40 rounded-lg border border-white/5 backdrop-blur-sm flex items-center px-3">
            <Terminal size={12} className="text-slate-500 mr-2 shrink-0" />
            <AnimatePresence mode='wait'>
                <motion.p
                    key={message} // Triggers animation on change
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-xs font-mono truncate ${type === 'win' ? 'text-emerald-400 font-bold' :
                            type === 'loss' ? 'text-red-400' : 'text-slate-400'
                        }`}
                >
                    {message || "System Ready. Waiting for Spin..."}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
