import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Shield, Timer, Users, TrendingUp } from 'lucide-react';

const ReferralEmpireUI = ({ empireHands = [] }) => {
    // Get the most active or matured hand
    const activeHand = empireHands.find(h => h.status === 'active' || h.status === 'matured') || { 
        directs: [], 
        status: 'active', 
        handIndex: 1 
    };

    const isMatured = activeHand.status === 'matured';
    const fingers = [0, 1, 2, 3, 4]; // The 5 direct slots

    return (
        <div className="relative p-6 rounded-[2.5rem] bg-slate-950 border border-indigo-500/30 overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                        <Crown className="w-6 h-6 text-yellow-400" />
                        EMPIRE HAND <span className="text-indigo-500">#{activeHand.handIndex}</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Team Building Race (5x5 Matrix)
                    </p>
                </div>
                {isMatured && (
                    <div className="bg-emerald-500/20 border border-emerald-500/50 px-4 py-2 rounded-2xl flex items-center gap-2 animate-bounce">
                        <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                        <span className="text-emerald-400 font-black text-sm">MATURED!</span>
                    </div>
                )}
            </div>

            {/* The Hand Visualization (5 Fingers) */}
            <div className="relative z-10 grid grid-cols-5 gap-3 mb-8">
                {fingers.map((idx) => {
                    const finger = activeHand.directs[idx];
                    const progress = finger ? (finger.downlineCount || 0) : 0;
                    const isQualified = finger?.isQualified;
                    const isActive = !!finger;

                    return (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative flex flex-col items-center gap-3 p-3 rounded-3xl border transition-all duration-500 ${
                                isQualified 
                                ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                                : isActive 
                                    ? 'bg-white/5 border-white/10' 
                                    : 'bg-black/40 border-dashed border-white/5'
                            }`}
                        >
                            {/* Finger Progress Ring */}
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle 
                                        cx="24" cy="24" r="20" 
                                        className="stroke-slate-800 fill-none" 
                                        strokeWidth="4" 
                                    />
                                    <motion.circle 
                                        cx="24" cy="24" r="20" 
                                        className={`fill-none transition-all duration-1000 ${
                                            isQualified ? 'stroke-indigo-400' : 'stroke-indigo-600/50'
                                        }`}
                                        strokeWidth="4" 
                                        strokeDasharray="126"
                                        strokeDashoffset={126 - (126 * Math.min(progress, 5)) / 5}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute text-xs font-black text-white">
                                    {isQualified ? '✓' : progress}
                                </div>
                            </div>

                            {/* Label */}
                            <div className="text-[10px] font-black uppercase text-center leading-tight">
                                <span className={isActive ? 'text-indigo-300' : 'text-slate-600'}>
                                    Finger {idx + 1}
                                </span>
                            </div>

                            {/* Status Glow */}
                            {isQualified && (
                                <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-sm -z-10" />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer / Reward Info */}
            <div className="relative z-10 bg-white/5 border border-white/5 rounded-[2rem] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase">Estimated Reward</p>
                        <h4 className="text-xl font-black text-white tracking-tighter">1,500 <span className="text-xs text-indigo-400">NXS</span></h4>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    {isMatured ? (
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                            <Timer className="w-4 h-4" />
                            <span>Matures in 7 Days</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                            <Shield className="w-4 h-4" />
                            <span>Safe & Verified</span>
                        </div>
                    )}
                    <p className="text-[10px] text-slate-600 mt-1 uppercase font-black tracking-widest">Team Bonus System</p>
                </div>
            </div>

            {/* Decorative Hand SVG Silhouette (Subtle) */}
            <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 translate-y-1/4">
                <Users size={300} />
            </div>
        </div>
    );
};

export default ReferralEmpireUI;
