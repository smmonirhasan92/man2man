'use client';
import { Activity, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function CommissionHistory({ logs = [] }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="text-center py-10 bg-[#1f2937] rounded-xl border border-white/5">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No commission history found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log._id} className="bg-[#1f2937] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${log.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {log.amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white max-w-[150px] truncate">{log.description}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold ${log.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {log.amount > 0 ? '+' : ''}{parseFloat(log.amount).toFixed(2)}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                            {log.type.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
