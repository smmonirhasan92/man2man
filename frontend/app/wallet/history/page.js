'use client';
import { useEffect, useState } from 'react';
import api from '../../../services/api';
import BottomNav from '../../../components/BottomNav';
import Link from 'next/link';
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, Wallet, Gamepad2, Gift, Send, CheckCircle, RefreshCw, Star } from 'lucide-react';

const groupTransactionsByDate = (transactions) => {
    if (!Array.isArray(transactions)) return {};
    const groups = {};
    transactions.forEach(tx => {
        const date = new Date(tx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
    });
    return groups;
};

const getTransactionMeta = (type) => {
    switch (type) {
        case 'add_money': 
        case 'deposit': return { icon: ArrowDownLeft, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Deposit (Buy NXS)' };
        case 'withdraw': 
        case 'cash_out': return { icon: ArrowUpRight, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Withdraw (Sell NXS)' };
        case 'send_money': return { icon: Send, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'P2P Transfer' };
        case 'game_win': return { icon: Gamepad2, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Game Reward' };
        case 'game_loss': return { icon: Gamepad2, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Game Play' };
        case 'commission': return { icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'System Commission' };
        case 'wallet_transfer': return { icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Wallet Swap' };
        case 'referral_bonus': return { icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Referral Bonus' };
        case 'task_reward': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Task Income' };
        default: return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10', label: type?.replace(/_/g, ' ') || 'Unknown' };
    }
};

export default function HistoryPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/transaction/history');
                setTransactions(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const groupedTransactions = groupTransactionsByDate(transactions);

    return (
        <div className="flex flex-col h-screen bg-[#070b14] font-sans">
            {/* Professional App Header */}
            <div className="bg-[#0b1221]/90 backdrop-blur-xl px-6 py-5 flex items-center gap-4 shadow-sm z-10 sticky top-0 border-b border-white/5">
                <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition active:scale-95">
                    <ArrowLeft className="w-5 h-5 text-slate-300" />
                </Link>
                <div>
                    <h1 className="text-lg font-black text-white uppercase tracking-tight">Ledger & History</h1>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Your Financial Activity</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide pt-6 space-y-8">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500/20 border-t-indigo-500"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Syncing Ledger...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-3/4 text-center">
                        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Clock className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Activity</h3>
                        <p className="text-slate-500 text-xs font-medium max-w-[200px] mt-2 leading-relaxed">
                            Your recent transactions and earnings will appear here.
                        </p>
                    </div>
                ) : (
                    <div>
                        {Object.keys(groupedTransactions).map((date) => (
                            <div key={date} className="mb-8">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 pl-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                    {date}
                                </h3>
                                <div className="space-y-3">
                                    {groupedTransactions[date].map((tx) => {
                                        const meta = getTransactionMeta(tx.type);
                                        const Icon = meta.icon;
                                        const isCredit = parseFloat(tx.amount) > 0;
                                        const isPending = ['pending', 'pending_instructions', 'awaiting_payment', 'final_review'].includes(tx.status);
                                        const isRejected = tx.status === 'rejected' || tx.status === 'failed';

                                        return (
                                            <div key={tx.id || tx._id} className="bg-[#0b1221] p-4 md:p-5 rounded-3xl border border-white/5 flex items-center justify-between active:scale-[0.98] transition-transform shadow-xl shadow-black/20 group hover:border-white/10">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} shrink-0 shadow-inner`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="font-black text-slate-200 text-sm md:text-base capitalize tracking-tight truncate">
                                                            {meta.label}
                                                        </p>
                                                        <p className="text-[10px] md:text-xs text-slate-400 font-medium truncate mt-0.5 max-w-[180px]">
                                                            {tx.description || tx.recipientDetails || 'System Transfer'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-widest ${
                                                                isPending ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                                isRejected ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            }`}>
                                                                {isPending ? 'Processing' : tx.status}
                                                            </span>
                                                            <span className="text-[8px] text-slate-600 font-mono font-bold tracking-wider">
                                                                #{tx.id ? tx.id.slice(-6) : tx._id?.slice(-6)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`font-black text-lg md:text-xl tracking-tighter ${
                                                        isPending ? 'text-amber-400' :
                                                        isRejected ? 'text-slate-500 line-through' :
                                                        isCredit ? 'text-emerald-400' : 'text-slate-200'
                                                    }`}>
                                                        {isCredit ? '+' : ''}{parseFloat(tx.amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                        {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    );
}

