import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Shield, Target, Users, TrendingUp, Trophy, Flame } from 'lucide-react';

const ReferralEmpireUI = ({ stats }) => {
    // Graceful fallbacks
    const monthlySprint = stats?.monthlySprint || { directsCount: 0, volume: 0, bonusClaimed: false };
    const directEmpire = stats?.directEmpire || { totalCount: 0, isMatured: false };
    const teamEmpire = stats?.teamEmpire || { currentTeamMembers: [], completedTeams: 0 };

    // Calculate Percentages
    const sprintPercent = Math.min((monthlySprint.directsCount / 5) * 100, 100);
    const directEmpirePercent = Math.min((directEmpire.totalCount / 20) * 100, 100);
    const teamEmpirePercent = Math.min((teamEmpire.currentTeamMembers.length / 25) * 100, 100);

    const ProgressRing = ({ percentage, colorClass, size = 64, strokeWidth = 6, children }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg className="w-full h-full -rotate-90 transform">
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        className="stroke-slate-800/50 fill-none"
                        strokeWidth={strokeWidth}
                    />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        className={`fill-none ${colorClass}`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center gap-2 uppercase tracking-widest">
                        <Crown className="w-6 h-6 text-yellow-500" />
                        Empire Status
                    </h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                        3-Tier Growth Tracker
                    </p>
                </div>
                {teamEmpire.completedTeams > 0 && (
                    <div className="flex flex-col items-end">
                        <div className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <Trophy className="w-3 h-3" />
                            {teamEmpire.completedTeams}x Teams Completed
                        </div>
                    </div>
                )}
            </div>

            {/* TRACKER 1: MONTHLY SPRINT */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-5 rounded-[2rem] bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-500/20 overflow-hidden shadow-xl group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[50px] group-hover:bg-rose-500/20 transition-all" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ProgressRing percentage={sprintPercent} colorClass="stroke-rose-500">
                            <Flame className={`w-6 h-6 ${sprintPercent >= 100 ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} />
                        </ProgressRing>
                        <div>
                            <h3 className="text-white font-black text-base uppercase flex items-center gap-2">
                                Monthly Sprint
                                {monthlySprint.bonusClaimed && <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded uppercase">Claimed</span>}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-bold mt-1">5 Directs = 5% Volume Bonus</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">{monthlySprint.directsCount}<span className="text-sm text-slate-500">/5</span></p>
                    </div>
                </div>
            </motion.div>

            {/* TRACKER 2: LIFETIME DIRECT EMPIRE */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative p-5 rounded-[2rem] bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 overflow-hidden shadow-xl group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] group-hover:bg-indigo-500/20 transition-all" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ProgressRing percentage={directEmpirePercent} colorClass="stroke-indigo-400">
                            <TrendingUp className={`w-6 h-6 ${directEmpirePercent >= 100 ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
                        </ProgressRing>
                        <div>
                            <h3 className="text-white font-black text-base uppercase flex items-center gap-2">
                                Direct Empire
                                {directEmpire.isMatured && <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-2 py-0.5 rounded uppercase">Matured</span>}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-bold mt-1">20 Gold-Tier Directs = Mega Bonus</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">{directEmpire.totalCount}<span className="text-sm text-slate-500">/20</span></p>
                    </div>
                </div>
            </motion.div>

            {/* TRACKER 3: TEAM EMPIRE */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative p-5 rounded-[2rem] bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 overflow-hidden shadow-xl group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] group-hover:bg-amber-500/20 transition-all" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ProgressRing percentage={teamEmpirePercent} colorClass="stroke-amber-400" strokeWidth={8} size={72}>
                            <Users className={`w-7 h-7 ${teamEmpirePercent >= 100 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
                        </ProgressRing>
                        <div>
                            <h3 className="text-amber-400 font-black text-lg uppercase flex items-center gap-2 drop-shadow-md">
                                Team Empire
                            </h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">25 Team Members (L1 & L2)</p>
                            <div className="mt-2 bg-black/40 rounded-lg px-2 py-1 inline-flex items-center gap-1 border border-white/5">
                                <Zap className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px] text-slate-300 font-bold">Reward: 3000 NXS</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-amber-400 drop-shadow-md">{teamEmpire.currentTeamMembers.length}<span className="text-sm text-amber-700">/25</span></p>
                    </div>
                </div>
            </motion.div>

        </div>
    );
};

export default ReferralEmpireUI;
