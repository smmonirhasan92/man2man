'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { ArrowLeft, Search, Filter, Calendar, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AgentHistoryPage() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'completed', 'pending', 'commission'

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        filterData();
    }, [transactions, searchQuery, activeTab]);

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

    const filterData = () => {
        let data = [...transactions];

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(t =>
                t.id.toString().includes(lowerQ) ||
                (t.recipientDetails && t.recipientDetails.toLowerCase().includes(lowerQ)) ||
                (t.adminComment && t.adminComment.toLowerCase().includes(lowerQ))
            );
        }

        if (activeTab === 'commission') {
            data = data.filter(t => t.type === 'commission');
        } else if (activeTab !== 'all') {
            data = data.filter(t => t.status === activeTab && t.type !== 'commission');
        }

        setFilteredTransactions(data);
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[status] || 'bg-slate-700 text-slate-400'}`}>
                {status}
            </span>
        );
    };

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition relative z-10 ${activeTab === id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
        >
            {label}
            {activeTab === id && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-xl -z-10"
                />
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#1A1F2B] font-sans pb-20 text-slate-200">
            {/* Premium Header */}
            <div className="bg-[#1A1F2B]/90 backdrop-blur-md px-4 py-4 sticky top-0 z-30 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/agent/dashboard" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">History</h1>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search By ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition"
                    />
                </div>

                {/* Styled Tabs */}
                <div className="flex bg-[#111827] p-1.5 rounded-2xl border border-white/5">
                    <TabButton id="all" label="All" />
                    <TabButton id="completed" label="Done" />
                    <TabButton id="pending" label="Pending" />
                    <TabButton id="commission" label="Earned" />
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-xs font-medium">Loading history...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-16 opacity-50 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Filter className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-bold">No records found</p>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                            }
                        }}
                        className="space-y-3"
                    >
                        {filteredTransactions.map((trx) => (
                            <motion.div
                                key={trx.id}
                                variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                className="bg-[#1F2937] p-4 rounded-2xl border border-white/5 relative overflow-hidden group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${trx.type === 'commission' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {trx.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">#{trx.id}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(trx.createdAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg mb-1 ${trx.type === 'commission' || trx.type === 'admin_credit'
                                                ? 'text-emerald-400'
                                                : (trx.type === 'admin_debit' || (trx.type === 'add_money' && trx.status === 'completed'))
                                                    ? 'text-rose-400'
                                                    : 'text-white'
                                            }`}>
                                            {trx.type === 'commission' || trx.type === 'admin_credit' || (trx.type === 'send_money') ? '+' : (trx.type === 'admin_debit' ? '-' : '')}
                                            ৳{Math.abs(trx.amount)}
                                        </p>
                                        <StatusBadge status={trx.status} />
                                    </div>
                                </div>

                                {(trx.recipientDetails || trx.adminComment) && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1.5">
                                        {trx.recipientDetails && (
                                            <p className="text-xs text-slate-300 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                                <span className="opacity-70">To:</span>
                                                <span className="font-mono font-medium">{trx.recipientDetails}</span>
                                            </p>
                                        )}
                                        {trx.adminComment && (
                                            <p className="text-xs text-amber-400/80 italic border-l-2 border-amber-500/20 pl-2">
                                                {trx.adminComment}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
