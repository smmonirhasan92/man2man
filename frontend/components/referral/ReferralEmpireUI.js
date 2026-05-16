import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Shield, Target, Users, TrendingUp, Trophy, Flame, ChevronRight } from 'lucide-react';

const ReferralEmpireUI = ({ stats }) => {
    // Graceful fallbacks
    const monthlySprint = stats?.monthlySprint || { directsCount: 0, volume: 0, bonusClaimed: false };
    const directEmpire = stats?.directEmpire || { totalCount: 0, isMatured: false };
    const teamEmpire = stats?.teamEmpire || { currentTeamMembers: [], completedTeams: 0 };

    // Calculate Percentages
    const sprintPercent = Math.min((monthlySprint.directsCount / 5) * 100, 100);
    const directEmpirePercent = Math.min((directEmpire.totalCount / 20) * 100, 100);
    const teamEmpirePercent = Math.min((teamEmpire.currentTeamMembers.length / 25) * 100, 100);

    const ProgressBar = ({ percentage, colorClass, label, current, total, subLabel, icon: Icon, reward }) => (
        <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[2rem] space-y-4 relative overflow-hidden group hover:bg-white/5 transition-all duration-500">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${colorClass.replace('bg-', 'bg-').replace('500', '500/20')} border border-white/5`}>
                        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-base uppercase tracking-tight">{label}</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{subLabel}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white tracking-tighter">{current}</span>
                        <span className="text-sm font-bold text-slate-600">/ {total}</span>
                    </div>
                    {reward && (
                        <div className="mt-1 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                            <Zap size={10} className="text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase">{reward}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* The Actual Progress Bar */}
            <div className="space-y-2 relative z-10">
                <div className="h-3 w-full bg-black/40 rounded-full border border-white/5 p-[2px] overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full rounded-full ${colorClass} relative`}
                    >
                        {/* Glow effect on the bar */}
                        <div className={`absolute inset-0 blur-sm opacity-50 ${colorClass}`}></div>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -skew-x-12"></div>
                    </motion.div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <span>Progress</span>
                    <span className={percentage >= 100 ? 'text-emerald-400' : ''}>{percentage.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest">
                        <Crown className="w-6 h-6 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        Empire Status
                    </h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                        Live Tracking & Achievement Node
                    </p>
                </div>
                {teamEmpire.completedTeams > 0 && (
                    <div className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-2xl border border-indigo-500/30 flex items-center gap-2 shadow-xl animate-bounce">
                        <Trophy size={16} />
                        <span className="text-[10px] font-black uppercase">{teamEmpire.completedTeams}x Teams Mastered</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* 1. MONTHLY SPRINT */}
                <ProgressBar 
                    label="Monthly Sprint"
                    subLabel="This Month Performance"
                    current={monthlySprint.directsCount}
                    total={5}
                    percentage={sprintPercent}
                    colorClass="bg-gradient-to-r from-rose-600 to-rose-400"
                    icon={Flame}
                    reward="5% Volume Bonus"
                />

                {/* 2. DIRECT EMPIRE */}
                <ProgressBar 
                    label="Direct Empire"
                    subLabel="Lifetime Direct Network"
                    current={directEmpire.totalCount}
                    total={20}
                    percentage={directEmpirePercent}
                    colorClass="bg-gradient-to-r from-indigo-600 to-indigo-400"
                    icon={Target}
                    reward="Mega Achievement Bonus"
                />

                {/* 3. TEAM EMPIRE */}
                <ProgressBar 
                    label="Team Empire"
                    subLabel="Combined L1 & L2 Mates"
                    current={teamEmpire.currentTeamMembers.length}
                    total={25}
                    percentage={teamEmpirePercent}
                    colorClass="bg-gradient-to-r from-amber-500 to-yellow-400"
                    icon={Users}
                    reward="3000 NXS Special Reward"
                />
            </div>

            {/* Legend / Info */}
            <div className="mx-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-500/50 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                    Achievement system is automated. Once you reach 100%, bonuses will be instantly unlocked and accessible via the claim section above. No manual locks applied.
                </p>
            </div>
        </div>
    );
};

export default ReferralEmpireUI;
