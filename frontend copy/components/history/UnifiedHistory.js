'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Trophy, AlertCircle, Clock, Copy, Check, Filter } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

export default function UnifiedHistory() {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState('all'); // all, game, transaction, referral
    const [copiedId, setCopiedId] = useState(null);
    const socket = useSocket('/system');

    useEffect(() => {
        fetchHistory();
    }, []);

    // Real-time Update
    useEffect(() => {
        if (!socket) return;
        socket.on('balance_update', () => fetchHistory());
        return () => { socket.off('balance_update'); };
    }, [socket]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/history/all?limit=50');
            setHistory(data);
        } catch (e) {
            console.error("History fetch failed", e);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredHistory = history.filter(item => {
        if (filter === 'all') return true;
        return item.source === filter;
    });

    const formatTitle = (item) => {
        if (item.source === 'game' && item.amount > 0) return `Verified Task Reward`;
        if (item.source === 'game') return `Task Entry Fee`;
        if (item.type === 'referral_bonus') return `Referral Commission`;
        return item.title;
    };

    const getCurrency = (item) => {
        // [FIXED] Explicit Currency Handling (Check Metadata too)
        if (item.currency === 'USD' || item.metadata?.currency === 'USD') return '$';
        if (item.currency === 'BDT' || item.metadata?.currency === 'BDT' || item.currency === 'NXS') return 'NXS';

        // Inference based on Context
        if (item.type === 'task_reward' || item.source === 'income' || item.type === 'referral_commission') return '$';

        // Transfer Logic: Deductions from Income are USD, Additions to Main are BDT
        if (item.description && item.description.includes('Income')) {
            if (item.amount < 0) return '$'; // Debit from Income
            return 'NXS'; // Credit to Main
        }

        return 'NXS';
    };

    const formatSubTitle = (item) => {
        if (item.source === 'game') return `Order #USA-${item.id.substring(item.id.length - 6).toUpperCase()}`;
        return item.description || `Transaction ID: ${(item.id || '').substring(0, 8)}...`;
    };

    return (
        <div className="w-full space-y-4 pb-24">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5 backdrop-blur-md overflow-x-auto no-scrollbar">
                {['all', 'game', 'transaction', 'referral'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 min-w-[80px] py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap
                            ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        {f === 'all' ? 'All' : f === 'game' ? 'Tasks' : f + 's'}
                    </button>
                ))}
            </div>

            {/* Desktop Table Header (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Transaction / ID</div>
                <div className="col-span-3">Date & Time</div>
                <div className="col-span-3 text-right">Amount</div>
                <div className="col-span-2 text-right">Status</div>
            </div>

            {/* List / Table Rows */}
            <div className="space-y-2">
                <AnimatePresence mode='popLayout'>
                    {filteredHistory.map((item, index) => (
                        <motion.div
                            key={item.id || index}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-colors group"
                        >
                            {/* Mobile Layout (Flex) */}
                            <div className="flex md:hidden items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0
                                        ${item.amount > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
                                    `}>
                                        {item.source === 'game' ? <Trophy size={18} /> : item.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-200">{formatTitle(item)}</h4>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                            {formatSubTitle(item)}
                                            <button onClick={() => copyToClipboard(item.id)} className="hover:text-white">
                                                {copiedId === item.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${item.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {item.amount > 0 ? '+' : ''}{getCurrency(item)}{Math.abs(item.amount).toFixed(2)}
                                    </div>
                                    <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded inline-block mt-1
                                        ${item.status === 'completed' || item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}
                                    `}>
                                        {item.status}
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Layout (Grid) */}
                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0
                                        ${item.amount > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
                                    `}>
                                        {item.source === 'game' ? <Trophy size={14} /> : item.amount > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-200">{formatTitle(item)}</div>
                                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1 cursor-pointer" onClick={() => copyToClipboard(item.id)}>
                                            {item.id} {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-3 text-xs text-slate-400 font-mono">
                                    {new Date(item.date).toLocaleString()}
                                </div>
                                <div className={`col-span-3 text-right font-mono font-bold ${item.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    {item.amount > 0 ? '+' : ''}{getCurrency(item)}{Math.abs(item.amount).toFixed(2)}
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded
                                        ${item.status === 'completed' || item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}
                                    `}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {filteredHistory.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm flex flex-col items-center gap-2">
                        <Filter className="w-8 h-8 opacity-20" />
                        No records found in this category.
                    </div>
                )}
            </div>
        </div>
    );
}
