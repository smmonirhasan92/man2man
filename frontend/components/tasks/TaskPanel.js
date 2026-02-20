import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';

export default function TaskPanel({ user, tasks }) {
    // Botanical Gold Theme
    const completed = user?.taskData?.tasksCompletedToday || 0;
    const limit = 10;
    const progress = Math.min((completed / limit) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-6 mb-4"
        >
            <div className="rounded-2xl bg-gradient-to-br from-[#0F3057]/90 to-[#0A2540]/90 border border-yellow-500/20 shadow-xl backdrop-blur-md overflow-hidden relative group">

                {/* Gold Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-yellow-500/20 transition-colors"></div>

                <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Daily Tasks</h3>
                                <p className="text-[10px] text-yellow-500/70 uppercase tracking-widest">Income Engine</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Today's Earnings</span>
                            <div className="text-lg font-mono font-bold text-green-400">${Number(user?.todaysTaskEarnings || 0).toFixed(4)}</div>
                        </div>
                    </div>

                    {/* Clean Progress Bar */}
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-slate-300">{completed} / {limit} Completed</span>
                        <span className="text-[9px] text-slate-500">{limit - completed} Remaining</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                        ></motion.div>
                    </div>

                    {/* Action */}
                    <button
                        onClick={() => window.location.href = '/tasks'}
                        className="w-full mt-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/20 transition-all active:scale-95">
                        Start Next Task
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
