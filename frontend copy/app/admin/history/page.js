'use client';
import { useEffect, useState, Suspense } from 'react';
import api from '../../../services/api';
import { ArrowLeft, Search, Filter, Smartphone, Wallet, Send, Gamepad2, Gift, Ban, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';


function HistoryContent() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, add_money, mobile_recharge, send_money
    const [search, setSearch] = useState('');

    // Get searchParams
    const searchParams = useSearchParams();
    const userId = searchParams.get('user');

    useEffect(() => {
        fetchHistory();
    }, [userId]);

    const fetchHistory = async () => {
        try {
            // Include userId in query if present
            const endpoint = userId ? `/transactions/all?userId=${userId}` : '/transactions/all';
            const res = await api.get(endpoint);
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getMeta = (type) => {
        switch (type) {
            case 'add_money': return { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Add Money' };
            case 'mobile_recharge': return { icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Mobile Recharge' };
            case 'send_money': return { icon: Send, color: 'text-pink-600', bg: 'bg-pink-50', label: 'Send Money' };
            case 'game_win': return { icon: Gamepad2, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Game Win' };
            case 'commission': return { icon: Gift, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Commission' };
            case 'wallet_transfer': return { icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Wallet Transfer' };
            case 'referral_bonus': return { icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Referral Bonus' };
            case 'task_reward': return { icon: CheckCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Task Reward' };
            default: return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', label: type.replace('_', ' ') };
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'all' || tx.type === filter;

        // Safe Search with Lowercase checks
        const searchLower = search.toLowerCase();
        const matchesSearch = search === '' ||
            tx.id?.toString().includes(search) ||
            tx.User?.phone?.includes(search) || // Optional chaining handles missing User or Phone
            (tx.User?.fullName && tx.User.fullName.toLowerCase().includes(searchLower)) || // Check existence before toLowerCase
            (tx.recipientDetails && tx.recipientDetails.toLowerCase().includes(searchLower)); // Added search by details too

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-slate-100 px-4 py-4 md:px-8">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2.5 hover:bg-slate-100 rounded-xl transition border border-slate-200 text-slate-600">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">History</h1>
                            <p className="text-xs text-slate-500 font-medium">All User Transactions</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Phone, Name or TrxID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {['all', 'add_money', 'mobile_recharge', 'send_money'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition capitalize ${filter === f
                                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                                        <div>
                                            <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                                            <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-slate-50">
                                    <div className="h-3 w-full bg-slate-200 rounded"></div>
                                    <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-20 opacity-50 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-slate-600 text-lg">No Transactions Found</h3>
                        <p className="text-slate-400">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((trx) => {
                            const meta = getMeta(trx.type);
                            const Icon = meta.icon;
                            const isCredit = parseFloat(trx.amount) > 0;

                            return (
                                <div key={trx.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition group relative overflow-hidden flex flex-col justify-between">

                                    {/* Top Row: Icon, Title, Status */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} shrink-0`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 capitalize">{meta.label}</p>
                                                <p className="text-xs text-slate-400 font-mono">{new Date(trx.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${trx.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            trx.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {trx.status}
                                        </span>
                                    </div>

                                    {/* Middle: Details & Amount */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                            <span className="text-xs text-slate-500 font-medium">Amount</span>
                                            <span className={`font-mono font-bold text-base ${isCredit ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                {isCredit ? '+' : ''}{parseFloat(trx.amount).toFixed(2)} ৳
                                            </span>
                                        </div>

                                        <div className="space-y-1 px-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">User:</span>
                                                <span className="font-medium text-slate-700">{trx.User?.fullName} <span className="text-slate-400">({trx.User?.phone})</span></span>
                                            </div>
                                            {trx.recipientDetails && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-400">Details:</span>
                                                    <span className="font-medium text-slate-600 max-w-[200px] truncate" title={trx.recipientDetails}>{trx.recipientDetails}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom: ID & Decor */}
                                    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-slate-300">ID: {trx.id}</span>
                                        {trx.adminComment && (
                                            <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded">Note Added</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TransactionHistoryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        }>
            <HistoryContent />
        </Suspense>
    );
}
