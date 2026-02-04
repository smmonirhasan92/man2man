'use client';



import { Ticket, Copy, Trophy, ChevronDown, ChevronUp } from 'lucide-react'; // Ensure import exists
import { useState } from 'react';

export default function LotteryHistory({ history, mode = 'GLOBAL' }) {
    const [expandedPrizes, setExpandedPrizes] = useState({});

    if (!history || history.length === 0) {
        return <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No History Found</p>
            <p className="text-xs text-slate-600">Tickets will appear here when you join a draw.</p>
        </div>;
    }

    return (
        <div className="space-y-3 mt-4">
            {history.map((item, idx) => (
                <div key={idx} className="bg-[#0f172a] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/30 transition relative overflow-hidden group">
                    {/* Background Shine */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition"></div>

                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.tier === 'FLASH' ? 'bg-red-900/20 text-red-500' :
                                item.tier === 'HOURLY' ? 'bg-blue-900/20 text-blue-500' : 'bg-emerald-900/20 text-emerald-500'
                                }`}>
                                <Ticket className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 uppercase text-sm">{item.tier || 'Lottery'}</h4>
                                <p className="text-[10px] text-slate-500 font-mono">
                                    {new Date(item.drawnAt || item.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30'
                                }`}>
                                {item.status}
                            </div>
                        </div>
                    </div>

                    {/* MODE: GLOBAL WINS */}
                    {mode === 'GLOBAL' && item.winners && (
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                            <div className="flex flex-wrap gap-2">
                                {item.winners?.map((w, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-emerald-900/10 px-2 py-1 rounded border border-emerald-500/10">
                                        <span className="text-emerald-400 font-bold text-xs">{w.username}</span>
                                        <span className="text-yellow-500 font-mono text-[10px]">+{w.amount || w.wonAmount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MODE: MY TICKETS */}
                    {mode === 'MY_TICKETS' && item.tickets && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-400 px-1 items-center">
                                <span>My Tickets ({item.myTotalTickets})</span>
                                <button onClick={() => togglePrizes(idx)} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition uppercase font-bold">
                                    {expandedPrizes[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {expandedPrizes[idx] ? 'Hide Payouts' : 'View Payouts'}
                                </button>
                            </div>

                            {/* PRIZE STRUCTURE DROPDOWN */}
                            {expandedPrizes[idx] && item.prizes && (
                                <div className="bg-[#050505] p-2 rounded border border-white/5 mb-2 grid grid-cols-2 gap-2">
                                    {item.prizes.map((p, pi) => (
                                        <div key={pi} className="flex justify-between items-center text-[10px] text-slate-500">
                                            <span>{p.name}</span>
                                            <span className="text-yellow-500 font-mono">৳{p.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between text-xs text-slate-400 px-1 mt-2">
                                <span>Result</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 customize-scrollbar">
                                {item.tickets?.map((t, i) => (
                                    <div key={i} className={`flex justify-between items-center p-2 rounded border ${t.status === 'WIN'
                                        ? 'bg-emerald-900/20 border-emerald-500/30'
                                        : t.status === 'PENDING'
                                            ? 'bg-white/5 border-white/5'
                                            : 'bg-red-900/10 border-red-900/20 opacity-60'
                                        }`}>
                                        <span className="font-mono text-xs text-slate-300 select-all cursor-pointer hover:text-white transition" title="Click to Copy">
                                            #{t.ticketNumber}
                                        </span>

                                        {t.status === 'WIN' ? (
                                            <div className="flex items-center gap-2 animate-pulse">
                                                <span className="text-yellow-400 font-bold text-xs">WIN</span>
                                                <span className="text-emerald-400 font-mono text-xs border border-emerald-500/30 px-1 rounded">+{t.winAmount}</span>
                                            </div>
                                        ) : (
                                            <span className={`text-[10px] font-bold ${t.status === 'PENDING' ? 'text-blue-400' : 'text-slate-600'}`}>
                                                {t.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
