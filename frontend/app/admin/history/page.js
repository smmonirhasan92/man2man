'use client';
import { useEffect, useState, Suspense } from 'react';
import api from '../../../services/api';
import { ArrowLeft, Search, Filter, Smartphone, Wallet, Send, Gamepad2, Gift, Ban, CheckCircle, Clock, ArrowDownLeft, ArrowUpRight, RefreshCw, Star, Check, X, Copy } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';


function HistoryContent() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, add_money, send_money
    const [search, setSearch] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [actionLoading, setActionLoading] = useState(null);

    const handleCopy = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} Copied!`);
    };

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

    const handleAction = async (trx, action) => {
        const id = trx._id || trx.id;
        const type = trx.type;

        setConfirmModal({
            isOpen: true,
            title: action === 'completed' ? 'Approve Transaction' : 'Reject Transaction',
            message: `Are you sure you want to ${action === 'completed' ? 'approve' : 'reject'} this ${type.replace('_', ' ')} request?`,
            confirmText: action === 'completed' ? 'Approve' : 'Reject',
            onConfirm: async () => {
                setActionLoading(id);
                try {
                    let endpoint = '';
                    let payload = { transactionId: id, status: action, adminComment: `Processed via Ledger: ${action}` };

                    if (type === 'cash_out' || type === 'withdraw') {
                        endpoint = '/withdrawal/process';
                    } else if (['add_money', 'recharge', 'deposit'].includes(type)) {
                        // For deposits, we might use a different endpoint or the generic one
                        endpoint = '/transactions/complete'; 
                        payload = { ...payload, comment: payload.adminComment };
                    } else {
                        endpoint = '/transactions/complete';
                        payload = { ...payload, comment: payload.adminComment };
                    }

                    await api.post(endpoint, payload);
                    toast.success(`Transaction ${action} successfully`);
                    fetchHistory();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Action failed');
                } finally {
                    setActionLoading(null);
                    setConfirmModal({ isOpen: false });
                }
            }
        });
    };

    const getMeta = (type) => {
        switch (type) {
            case 'add_money': 
            case 'deposit': return { icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Deposit (Buy NXS)' };
            case 'withdraw': 
            case 'cash_out': return { icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Withdraw (Sell NXS)' };
            case 'send_money': return { icon: Send, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', label: 'P2P Transfer' };
            case 'game_win': return { icon: Gamepad2, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Game Reward' };
            case 'game_loss': return { icon: Gamepad2, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Game Play' };
            case 'commission': return { icon: Star, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', label: 'System Commission' };
            case 'wallet_transfer': return { icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Wallet Swap' };
            case 'referral_bonus': return { icon: Gift, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Referral Bonus' };
            case 'task_reward': return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Task Income' };
            default: return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: type?.replace(/_/g, ' ') || 'Unknown' };
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter = filter === 'all' || tx.type === filter;

        // Safe Search with Lowercase checks
        const searchLower = search.toLowerCase();
        const matchesSearch = search === '' ||
            tx.id?.toString().includes(search) ||
            tx._id?.toString().includes(search) ||
            tx.userId?.phone?.includes(search) ||
            tx.User?.phone?.includes(search) ||
            (tx.userId?.fullName && tx.userId.fullName.toLowerCase().includes(searchLower)) ||
            (tx.User?.fullName && tx.User.fullName.toLowerCase().includes(searchLower)) ||
            (tx.recipientDetails && tx.recipientDetails.toLowerCase().includes(searchLower));

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#070b14] font-sans pb-20 text-slate-200">
            {/* Header */}
            <div className="bg-[#0b1221]/90 backdrop-blur-xl sticky top-0 z-20 shadow-sm border-b border-white/5 px-4 py-4 md:px-8">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10 text-slate-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tight">System Ledger</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">All Network Transactions</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

                {/* Search & Filter Bar */}
                <div className="bg-[#0b1221]/80 p-4 rounded-[2rem] shadow-sm border border-white/5 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by Phone, Name or TrxID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-black/40 border border-white/5 focus:border-indigo-500/50 font-bold text-white outline-none placeholder-slate-600 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide items-center">
                        {['all', 'add_money', 'send_money', 'cash_out'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === f
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
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
                            <div key={i} className="bg-[#0b1221]/50 p-6 rounded-3xl border border-white/5 animate-pulse flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl"></div>
                                        <div>
                                            <div className="h-4 w-32 bg-white/5 rounded mb-2"></div>
                                            <div className="h-3 w-20 bg-white/5 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 w-24 bg-white/5 rounded-full"></div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="h-3 w-full bg-white/5 rounded"></div>
                                    <div className="h-3 w-2/3 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-24 bg-[#0b1221]/40 rounded-[3rem] border border-dashed border-white/10">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
                            <Search className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="font-black text-slate-400 uppercase tracking-widest text-lg">No Transactions Found</h3>
                        <p className="text-slate-600 text-xs font-bold mt-2 uppercase tracking-wider">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((trx) => {
                            const meta = getMeta(trx.type);
                            const Icon = meta.icon;
                            const isCredit = parseFloat(trx.amount) > 0;
                            const isPending = ['pending', 'pending_instructions', 'awaiting_payment', 'final_review', 'expired'].includes(trx.status);
                            const isRejected = trx.status === 'rejected' || trx.status === 'failed';
                            const canProcess = isPending && ['cash_out', 'withdraw', 'add_money', 'recharge', 'deposit'].includes(trx.type);

                            return (
                                <div key={trx.id || trx._id} className="bg-[#0b1221]/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden flex flex-col justify-between shadow-xl shadow-black/20">

                                    {/* Top Row: Icon, Title, Status */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${meta.bg} ${meta.color} shrink-0 shadow-inner`}>
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-lg tracking-tight capitalize">{meta.label}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    {new Date(trx.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                            trx.status === 'expired' ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/20' :
                                            isPending ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            isRejected ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                            {isPending && trx.status !== 'expired' ? 'Processing' : trx.status}
                                        </span>
                                    </div>

                                    {/* Middle: Details & Amount */}
                                    <div className="space-y-4 flex-1">
                                        <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</span>
                                            <div className="text-right">
                                                <div className={`font-black text-xl tracking-tighter ${
                                                    isPending ? 'text-amber-400' :
                                                    isRejected ? 'text-slate-500 line-through' :
                                                    isCredit ? 'text-emerald-400' : 'text-slate-200'
                                                }`}>
                                                    {isCredit ? '+' : ''}{parseFloat(trx.amount).toFixed(2)} NXS
                                                </div>
                                                {(trx.type === 'cash_out' || trx.type === 'withdraw' || trx.type === 'add_money' || trx.type === 'recharge' || trx.type === 'deposit') && (
                                                    <div className={`text-xs font-black px-3 py-1.5 rounded-xl mt-2 inline-flex items-center gap-2 shadow-sm ${isCredit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500 text-white shadow-indigo-500/20'}`}>
                                                        <span className="opacity-70 text-[9px] uppercase tracking-widest">{isCredit ? 'Receivable' : 'Payable'}</span>
                                                        <span className="text-sm">৳ {(Math.abs(trx.amount) * 1.23).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 px-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">User</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white">{trx.userId?.fullName || trx.User?.fullName}</span>
                                                    <button 
                                                        onClick={() => handleCopy(trx.userId?.phone || trx.User?.phone, 'Phone Number')}
                                                        className="text-slate-500 hover:text-white transition flex items-center gap-1 group/copy"
                                                    >
                                                        <span className="text-slate-500 font-mono">({trx.userId?.phone || trx.User?.phone})</span>
                                                        <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Counterparty Info for P2P/Transfers */}
                                            {trx.relatedUserId && (
                                                <div className="flex justify-between items-center text-xs p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mt-2">
                                                    <span className="text-indigo-400 font-black uppercase text-[9px] tracking-widest">Trading With</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-indigo-300">{trx.relatedUserId.fullName}</span>
                                                        <button 
                                                            onClick={() => handleCopy(trx.relatedUserId.phone, 'Phone Number')}
                                                            className="text-indigo-500/50 hover:text-indigo-300 transition flex items-center gap-1 group/copy"
                                                        >
                                                            <span className="font-mono text-[11px]">({trx.relatedUserId.phone})</span>
                                                            <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {trx.recipientDetails && (
                                                <div className="flex justify-between items-start text-xs mt-2 p-2 bg-black/20 rounded-xl border border-white/5">
                                                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest pt-0.5">Details</span>
                                                    <button 
                                                        onClick={() => handleCopy(trx.recipientDetails, 'Payment Details')}
                                                        className="font-bold text-slate-400 max-w-[250px] text-right hover:text-white transition flex items-center gap-2 justify-end group/copy"
                                                        title="Click to copy details"
                                                    >
                                                        <span className="truncate">{trx.recipientDetails}</span>
                                                        <Copy className="w-3.5 h-3.5 shrink-0 text-indigo-400 opacity-50 group-hover/copy:opacity-100" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons for Pending/Expired */}
                                    {canProcess && (
                                        <div className="mt-6 flex gap-3">
                                            <button 
                                                onClick={() => handleAction(trx, 'rejected')}
                                                disabled={actionLoading === (trx._id || trx.id)}
                                                className="flex-1 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest border border-rose-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X className="w-3.5 h-3.5" /> Reject
                                            </button>
                                            <button 
                                                onClick={() => handleAction(trx, 'completed')}
                                                disabled={actionLoading === (trx._id || trx.id)}
                                                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Approve
                                            </button>
                                        </div>
                                    )}

                                    {/* Bottom: ID & Decor */}
                                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] font-mono font-bold text-slate-600 tracking-widest">TXID: {trx.id || trx._id}</span>
                                        {trx.adminComment && (
                                            <span className="text-[9px] text-indigo-400 font-black bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">Note Added</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}

export default function TransactionHistoryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        }>
            <HistoryContent />
        </Suspense>
    );
}
