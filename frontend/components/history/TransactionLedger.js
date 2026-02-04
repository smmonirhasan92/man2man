'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ArrowUpRight, ArrowDownLeft, Gamepad2, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function TransactionLedger() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchHistory();
    }, [filter]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/history/ledger?type=${filter}&limit=50`);
            setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (item) => {
        if (item.category === 'GAME') return <Gamepad2 className="w-5 h-5 text-purple-400" />;
        if (item.amount > 0) return <ArrowDownLeft className="w-5 h-5 text-emerald-400" />;
        return <ArrowUpRight className="w-5 h-5 text-rose-400" />;
    };

    const getStatusColor = (status) => {
        if (status === 'completed' || status === 'WIN') return 'text-emerald-400 bg-emerald-400/10';
        if (status === 'LOSS') return 'text-slate-400 bg-slate-700/50';
        if (status === 'pending') return 'text-amber-400 bg-amber-400/10';
        return 'text-red-400 bg-red-400/10';
    };

    return (
        <div className="w-full bg-[#0f172a] rounded-xl overflow-hidden border border-white/5">
            {/* Header / Filter */}
            <div className="p-4 bg-[#1e293b] flex items-center justify-between border-b border-white/5">
                <h3 className="font-bold text-slate-200">Transaction Ledger</h3>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="bg-[#0f172a] text-xs text-slate-400 px-3 py-1.5 rounded-lg border border-white/10 outline-none focus:border-cyan-500"
                >
                    <option value="all">All Activity</option>
                    <option value="game">Game Logs</option>
                    <option value="add_money">Deposits</option>
                    <option value="withdraw">Withdrawals</option>
                </select>
            </div>

            {/* List */}
            <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 text-xs animate-pulse">Loading Ledger...</div>
                ) : history.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No transactions found.</div>
                ) : (
                    history.map((item, idx) => (
                        <div key={idx} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/5 group-hover:border-white/20 transition-colors`}>
                                    {getIcon(item)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-200">{item.displayType || 'TRANSACTION'}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-tight">{item.details}</p>
                                    <p className="text-[9px] text-slate-600 mt-0.5 max-w-[150px] truncate">{item._id}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`text-sm font-black ${item.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {item.amount > 0 ? '+' : ''}{Number(item.amount).toFixed(2)}
                                </span>
                                <div className="mt-1">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-600 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
