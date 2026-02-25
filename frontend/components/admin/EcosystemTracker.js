'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ArrowDownToLine, ArrowUpFromLine, Activity, BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function EcosystemTracker() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEconomy = async () => {
        try {
            const { data } = await api.get('/admin/economy-sheet');
            setStats(data);
        } catch (e) {
            console.error("Economy Sync Error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEconomy();
        const interval = setInterval(fetchEconomy, 10000); // 10 Sec Poll
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) {
        return <div className="w-full h-32 flex items-center justify-center border border-white/5 rounded-2xl bg-slate-900/50 animate-pulse">
            <span className="text-slate-500 font-mono text-sm">Loading Ecosystem Analytics...</span>
        </div>;
    }

    const { today_generation, today_recovery, today_net, chart_data } = stats;

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <BarChart3 className="text-purple-500" />
                    Economy Balance Sheet
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/50">
                        TODAY'S METRICS
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Liability Generated */}
                <div className="bg-[#0f0f0f] border border-red-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <ArrowUpFromLine className="w-24 h-24 text-red-500" />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-red-400" /> Today's Liability Generated
                    </h3>
                    <div className="text-3xl font-black text-white tracking-tight relative z-10">
                        <span className="text-sm text-slate-500 font-normal">৳</span>
                        {today_generation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono relative z-10">
                        Money mined today via Tasks & Referrals
                    </p>
                </div>

                {/* 2. Recovery / Burned */}
                <div className="bg-[#0f0f0f] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <ArrowDownToLine className="w-24 h-24 text-emerald-500" />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-400" /> Today's Ecosystem Recovery
                    </h3>
                    <div className="text-3xl font-black text-white tracking-tight relative z-10">
                        <span className="text-sm text-slate-500 font-normal">৳</span>
                        {today_recovery.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono relative z-10">
                        Money burned via Lottery & Fees
                    </p>
                </div>

                {/* 3. Net Daily Drain */}
                <div className={`bg-[#0f0f0f] border ${today_net > 0 ? 'border-red-500/30' : 'border-emerald-500/30'} p-5 rounded-2xl relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <Activity className={`w-24 h-24 ${today_net > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10">
                        Net Daily Ecosystem Drain
                    </h3>
                    <div className="text-3xl font-black text-white tracking-tight relative z-10 flex items-baseline gap-2">
                        <span className={`text-xl ${today_net > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {today_net > 0 ? '+' : ''}
                        </span>
                        <span className="text-sm text-slate-500 font-normal">৳</span>
                        {today_net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-3 relative z-10">
                        {today_net > 0 ? (
                            <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/20">
                                Inflation: Recovery is Too Low
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20">
                                Deflation: Recovery is Healthy
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 7-Day Chart Representation (Simple Bar) */}
            <div className="mt-4 p-5 bg-[#0f0f0f] border border-white/5 rounded-2xl">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">7-Day Analysis (Generation vs Burn)</h3>
                <div className="grid grid-cols-7 gap-2 h-40 items-end">
                    {chart_data.map((day, idx) => {
                        const maxVal = Math.max(...chart_data.map(d => Math.max(d.generated, d.burned)), 1);
                        const genHeight = Math.max((day.generated / maxVal) * 100, 2);
                        const burnHeight = Math.max((day.burned / maxVal) * 100, 2);

                        return (
                            <div key={idx} className="flex flex-col items-center justify-end h-full gap-1 group relative">
                                <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 pointer-events-none">
                                    <div className="text-red-400">Generated: ৳{day.generated}</div>
                                    <div className="text-emerald-400">Burned: ৳{day.burned}</div>
                                </div>
                                <div className="flex gap-1 w-full justify-center items-end flex-1">
                                    {/* Generated Bar */}
                                    <div className="w-1/3 bg-red-500/50 rounded-t-sm transition-all" style={{ height: `${genHeight}%` }}></div>
                                    {/* Burned Bar */}
                                    <div className="w-1/3 bg-emerald-500/50 rounded-t-sm transition-all" style={{ height: `${burnHeight}%` }}></div>
                                </div>
                                <div className="text-[9px] text-slate-500 mt-2 font-mono truncate w-full text-center">
                                    {day.date.split('-').slice(1).join('/')}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        <div className="w-3 h-3 bg-red-500/50 rounded-sm"></div> New Liability Created
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        <div className="w-3 h-3 bg-emerald-500/50 rounded-sm"></div> Ecosystem Recovery (Burned)
                    </div>
                </div>
            </div>
        </div>
    );
}
