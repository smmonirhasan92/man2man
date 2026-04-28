import { Plane, Trophy, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function GlobalTourProgress({ tourSales = 0 }) {
    const GOAL = 20;
    const progress = Math.min((tourSales / GOAL) * 100, 100);
    const isCompleted = tourSales >= GOAL;

    return (
        <div className="w-full px-6 mb-4">
            <div className="relative bg-gradient-to-br from-[#0b1221] to-[#0A2540] border border-[#1e293b] rounded-[2rem] p-5 shadow-2xl overflow-hidden group">
                {/* Background Maps/Planes styling */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Plane size={120} className="text-white transform rotate-45" />
                </div>

                <div className="relative z-10 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Plane className="text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm uppercase tracking-wider">The Empire Tour</h3>
                            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1">
                                <MapPin size={10} className="text-blue-400" />
                                Thailand & Singapore
                            </p>
                        </div>
                    </div>
                    {isCompleted ? (
                        <div className="bg-emerald-500/20 px-2 py-1 rounded text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                            <Trophy size={12} /> Unlocked
                        </div>
                    ) : (
                        <div className="text-right">
                            <span className="text-white font-black text-lg">{tourSales}</span>
                            <span className="text-slate-500 font-bold text-xs">/{GOAL}</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="relative h-2.5 bg-slate-800/50 rounded-full overflow-hidden mb-3 border border-slate-700/50">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Tick Marks for realism */}
                    <div className="absolute top-0 left-1/4 w-px h-full bg-white/10" />
                    <div className="absolute top-0 left-2/4 w-px h-full bg-white/10" />
                    <div className="absolute top-0 left-3/4 w-px h-full bg-white/10" />
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-500">Premium Sales</span>
                    {isCompleted ? (
                        <span className="text-emerald-400 animate-pulse">Get ready to pack!</span>
                    ) : (
                        <span className="text-blue-400">{GOAL - tourSales} Sales left</span>
                    )}
                </div>

                <Link href="/referrals" className="mt-4 w-full bg-white/5 hover:bg-white/10 border border-white/5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-slate-300 text-xs font-bold uppercase transition-colors">
                    View Network Details <ChevronRight size={14} className="text-slate-500" />
                </Link>
            </div>
        </div>
    );
}
