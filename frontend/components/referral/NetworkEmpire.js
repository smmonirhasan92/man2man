'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Activity, TrendingUp, ChevronRight, Layers } from 'lucide-react';
import api from '../../services/api';
import EmpireTicker from './EmpireTicker';

export default function NetworkEmpire({ isOpen, onClose }) {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchStats();
    }, [isOpen]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/referral/network-empire');
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper for Heatmap Color
    const getHeatmapColor = (active, total, earnings, lastActivity) => {
        // [NEW] Inactivity Check (7 Days)
        if (lastActivity) {
            const daysSince = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
            if (daysSince > 7) return 'border-red-900/30 bg-red-950/20 shadow-none grayscale-[0.5]';
        }

        if (active === 0) return 'border-white/5 bg-slate-800/50';

        const ratio = active / (total || 1);
        // High Earnings or High Activity = Premium Colors
        if (earnings > 5000) return 'border-yellow-400/50 bg-yellow-900/20 shadow-[0_0_15px_rgba(250,204,21,0.2)]';
        if (ratio > 0.5) return 'border-emerald-400/50 bg-emerald-900/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]';
        return 'border-blue-400/30 bg-blue-900/20';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Slide Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0f172a] border-l border-white/10 z-50 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center gap-2">
                                    <Layers className="w-6 h-6 text-yellow-500" />
                                    NETWORK EMPIRE
                                </h2>
                                <p className="text-slate-400 text-xs font-medium">10-Level Deep Analysis</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {loading ? (
                                <div className="text-center py-20 text-slate-500 animate-pulse">Scanning Network...</div>
                            ) : (
                                stats.map((level, idx) => {
                                    const activeRatio = level.total ? Math.round((level.active / level.total) * 100) : 0;
                                    const themeClass = getHeatmapColor(level.active, level.total, level.earnings, level.lastActivity);

                                    return (
                                        <motion.div
                                            key={level.level}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`relative p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between group cursor-pointer overflow-hidden ${themeClass}`}
                                        >
                                            {/* Left: Level Info */}
                                            <div className="flex items-center gap-4 z-10">
                                                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center font-black text-lg text-slate-300 border border-white/5">
                                                    L{level.level}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold text-lg">{level.total}</span>
                                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Members</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                                                        <Activity className="w-3 h-3" />
                                                        {level.active} Active
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Earnings & Meter */}
                                            <div className="flex items-center gap-4 z-10">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400 font-medium">Earnings</p>
                                                    <p className="text-yellow-400 font-mono font-bold">৳{level.earnings?.toFixed(0)}</p>
                                                </div>

                                                {/* Circular Meter (Mini) */}
                                                <div className="relative w-10 h-10 flex items-center justify-center">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                        <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                        <path className="text-blue-500" strokeDasharray={`${activeRatio}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                    </svg>
                                                    <span className="text-[8px] absolute font-bold text-white">{activeRatio}%</span>
                                                </div>
                                            </div>

                                            {/* Deco BG */}
                                            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                                                <TrendingUp className="w-24 h-24 text-white" />
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Ticker Footer */}
                        <EmpireTicker />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
