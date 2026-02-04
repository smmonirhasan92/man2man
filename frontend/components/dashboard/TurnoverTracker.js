import React from 'react';
import { Lock, Unlock } from 'lucide-react';

export default function TurnoverTracker({ required, completed }) {
    const progress = required > 0 ? Math.min((completed / required) * 100, 100) : 100;
    const remaining = Math.max(0, required - completed);
    const isUnlocked = remaining === 0;

    return (
        <div className="w-full px-6 mb-4">
            <div className="bg-slate-900/60 rounded-xl p-3 border border-white/10 backdrop-blur-md relative overflow-hidden">
                {/* Glow Effect */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${isUnlocked ? 'from-green-500 to-emerald-400' : 'from-yellow-500 to-orange-400'}`}></div>

                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        {isUnlocked ? <Unlock className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-yellow-400" />}
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            {isUnlocked ? 'Withdrawal Unlocked' : 'Turnover Locked'}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-300">
                        {completed.toFixed(0)} / {required.toFixed(0)}
                    </span>
                </div>

                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-700 ${isUnlocked ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {!isUnlocked && (
                    <div className="mt-1 text-right">
                        <span className="text-[9px] text-white/50">Play ৳{remaining.toFixed(0)} more to unlock</span>
                    </div>
                )}
            </div>
        </div>
    );
}
