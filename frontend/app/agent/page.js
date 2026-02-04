'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, RefreshCcw } from 'lucide-react';
import AdminBottomNav from '../../components/AdminBottomNav';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
    const [stats, setStats] = useState({
        currentBalance: 0,
        totalEarnings: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const statsRes = await api.get('/agent/stats');
            setStats(statsRes.data);

            const trxRes = await api.get('/agent/transactions'); // Assigned Trx
            setTransactions(trxRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (id, status) => {
        try {
            await api.post('/transaction/complete', {
                transactionId: id,
                status: status
            });
            fetchData();
            toast.success('Success!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Agent Portal...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-[#1e1b4b] text-white p-6 pb-12 rounded-b-[2.5rem] relative shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold">Agent Dashboard</h1>
                    <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 border border-emerald-500/30">
                        LIVE AGENT
                    </div>
                </div>

                {/* Main Balance Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 text-center">
                        <p className="text-emerald-100 text-sm font-medium mb-1">Your Stock Balance</p>
                        <h2 className="text-4xl font-black text-white mb-2">
                            ৳{Number(stats.currentBalance).toLocaleString()}
                        </h2>
                        <div className="flex justify-center gap-2 items-center text-xs text-emerald-100/80">
                            <Wallet className="w-3 h-3" />
                            <span>Ready to Transfer</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 mt-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs">Total Commission Earned</p>
                            <h3 className="text-xl font-bold text-emerald-400">৳{Number(stats.totalEarnings).toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks / Requests Section */}
            <div className="px-5 -mt-4 relative z-10">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    Pending Requests
                </h3>

                {transactions.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                        <p className="text-slate-400 text-sm">No pending requests assigned to you.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map(trx => (
                            <div key={trx.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${trx.type === 'withdraw' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {trx.type.replace('_', ' ')}
                                        </span>
                                        <h4 className="font-bold text-slate-800 mt-1">{trx.User?.fullName || 'User'}</h4>
                                        <p className="text-xs text-slate-500">{trx.User?.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-800">৳{Math.abs(trx.amount)}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(trx.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button
                                        onClick={() => handleAction(trx.id, 'rejected')}
                                        className="py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(trx.id, 'completed')}
                                        className="py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition"
                                    >
                                        Approve & Process
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions (Floating or Bottom) */}
            <div className="fixed bottom-24 right-5">
                {/* Maybe a Float Action Button later */}
            </div>

            <AdminBottomNav />
        </div>
    );
}
