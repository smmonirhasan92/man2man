import React from 'react';
import { motion } from 'framer-motion';
import { Server, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NodeCarousel({ plans, activeId, onSelect }) {
    if (!plans || plans.length === 0) return null;

    return (
        <div className="w-full py-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Server size={14} className="text-amber-400" /> Your Active Nodes
                </h3>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                    {plans.length} Nodes
                </span>
            </div>

            <div className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar scroll-smooth">
                {plans.map((plan) => {
                    const isActive = activeId === plan.id;
                    const isDone = plan.tasksCompletedToday >= plan.dailyLimit;
                    const progress = (plan.tasksCompletedToday / plan.dailyLimit) * 100;

                    return (
                        <motion.div
                            key={plan.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                onSelect(plan);
                                if (!isActive) toast.success(`Switched to ${plan.planName}`);
                            }}
                            className={`flex-shrink-0 w-44 p-5 rounded-[2rem] border transition-all duration-500 relative overflow-hidden cursor-pointer ${
                                isDone 
                                ? 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5' 
                                : isActive 
                                    ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                                    : 'bg-slate-800/40 border-white/5 hover:border-white/20'
                            }`}
                        >
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                                {isDone ? (
                                    <span className="text-[8px] font-black bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30">
                                        DONE
                                    </span>
                                ) : isActive ? (
                                    <span className="flex items-center gap-1.5 text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400" /> LIVE
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-black bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">
                                        READY
                                    </span>
                                )}
                            </div>

                            {/* Plan Name */}
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDone ? 'text-amber-500/70' : isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                {plan.planName}
                            </p>
                            
                            {/* Phone / Identity */}
                            <div className="flex items-center gap-2 mb-4">
                                <img src="https://flagcdn.com/us.svg" className="w-4 h-3 rounded-[1px] opacity-80" alt="USA" />
                                <p className="text-xs font-mono font-bold text-white tracking-tight truncate">
                                    {plan.syntheticPhone?.slice(-10) || 'Connecting...'}
                                </p>
                            </div>

                            {/* Circular Progress (Sleek) */}
                            <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className={`h-full ${isDone ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                />
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Daily Tasks</span>
                                    <span className={`text-sm font-black font-mono ${isDone ? 'text-amber-400' : 'text-white'}`}>
                                        {plan.tasksCompletedToday || 0}/{plan.dailyLimit || 7}
                                    </span>
                                </div>
                                <Zap size={14} className={isDone ? 'text-amber-500 opacity-50' : isActive ? 'text-blue-500' : 'text-slate-700'} />
                            </div>

                            {/* Decorative Background Glows */}
                            {isActive && !isDone && (
                                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full" />
                            )}
                            {isDone && (
                                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/10 blur-2xl rounded-full" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
