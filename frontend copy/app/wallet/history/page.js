'use client';
import { useEffect, useState } from 'react';
import api from '../../../services/api';
import BottomNav from '../../../components/BottomNav';
import Link from 'next/link';
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, Wallet, Smartphone, Gamepad2, Gift, Send, CheckCircle } from 'lucide-react';

// Helper to group by date
const groupTransactionsByDate = (transactions) => {
    const groups = {};
    transactions.forEach(tx => {
        const date = new Date(tx.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
    });
    return groups;
};

// Helper for Icon & Color
const getTransactionMeta = (type) => {
    switch (type) {
        case 'add_money': return { icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Add Money' };
        case 'mobile_recharge': return { icon: Smartphone, color: 'text-violet-500', bg: 'bg-violet-50', label: 'Mobile Recharge' };
        case 'send_money': return { icon: Send, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Send Money' };
        case 'game_win': return { icon: Gamepad2, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Game Win' };
        case 'game_loss': return { icon: Gamepad2, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Game Play' };
        case 'commission': return { icon: Gift, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Commission' };
        case 'wallet_transfer': return { icon: ArrowUpRight, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Transfer' };
        case 'referral_bonus': return { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Referral Bonus' };
        case 'task_reward': return { icon: CheckCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Task Reward' };
        default: return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', label: type.replace('_', ' ') };
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
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const groupedTransactions = groupTransactionsByDate(transactions);

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm z-10 sticky top-0">
                <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="w-6 h-6 text-slate-700" /></Link>
                <h1 className="text-xl font-bold text-slate-800">Transaction History</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-3/4 text-center opacity-50">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">No Transactions Yet</h3>
                        <p className="text-slate-400 text-sm max-w-[200px]">Your recent activity will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6 pt-4">
                        {Object.keys(groupedTransactions).map((date) => (
                            <div key={date}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">{date}</h3>
                                <div className="space-y-3">
                                    {groupedTransactions[date].map((tx) => {
                                        const meta = getTransactionMeta(tx.type);
                                        const Icon = meta.icon;
                                        const isCredit = parseFloat(tx.amount) > 0;

                                        return (
                                            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} shrink-0`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-sm capitalize">{meta.label}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium max-w-[140px] truncate">
                                                            {tx.description || tx.recipientDetails || 'No details'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {tx.status}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">#{tx.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-slate-800'}`}>
                                                        {isCredit ? '+' : ''}{parseFloat(tx.amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
