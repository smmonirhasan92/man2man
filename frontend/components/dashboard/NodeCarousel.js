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
                            className={`flex-shrink-0 w-40 p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                                isActive 
                                ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                                : 'bg-slate-800/40 border-white/5 hover:border-white/20'
                            }`}
                        >
                            {/* Done Overlay */}
                            {isDone && (
                                <div className="absolute top-2 right-2 z-10">
                                    <CheckCircle size={16} className="text-emerald-400 fill-emerald-400/20" />
                                </div>
                            )}

                            {/* Plan Name */}
                            <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                {plan.planName}
                            </p>
                            
                            {/* Phone / Identity */}
                            <p className="text-xs font-mono text-white/90 truncate mb-3">
                                {plan.syntheticPhone || 'Connecting...'}
                            </p>

                            {/* Circular Progress (Simplified) */}
                            <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-bold">
                                    {plan.tasksCompletedToday}/{plan.dailyLimit}
                                </span>
                                {isActive && (
                                    <span className="flex items-center gap-1 text-[8px] text-emerald-400 animate-pulse font-black uppercase">
                                        <div className="w-1 h-1 rounded-full bg-emerald-400" /> Live
                                    </span>
                                )}
                            </div>

                            {/* Decorative Glow for Active */}
                            {isActive && (
                                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-500/20 blur-2xl rounded-full" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
