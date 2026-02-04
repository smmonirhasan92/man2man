'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, RefreshCcw, Bell, LogOut, ChevronRight, Check, X, Copy } from 'lucide-react';
import AdminBottomNav from '../../../components/AdminBottomNav';
import ImageSlider from '../../../components/ImageSlider';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        currentBalance: 0,
        totalEarnings: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null); // 'topup' | 'withdraw'
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bkash');
    const [details, setDetails] = useState('');

    const fetchData = async () => {
        try {
            const statsRes = await api.get('/agent/stats');
            setStats(statsRes.data);

            const trxRes = await api.get('/transactions/assigned'); // Assigned Trx
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

    const submitRequest = async (e) => {
        e.preventDefault();
        try {
            const endpoint = showModal === 'topup' ? '/agent/topup' : '/agent/withdraw';
            await api.post(endpoint, {
                amount,
                method,
                transactionId: showModal === 'topup' ? details : undefined,
                accountDetails: showModal === 'withdraw' ? details : undefined,
                note: details
            });
            toast.success('Request Submitted');
            setShowModal(null);
            setAmount('');
            setDetails('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#1A1F2B] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#1A1F2B] font-sans pb-24 text-slate-200">
            {/* Ultra-Slim Header */}
            <header className="px-6 pt-6 pb-2 mb-2 flex justify-between items-center sticky top-0 z-40 bg-[#1A1F2B]/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                        A
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg leading-tight">Agent Panel</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-emerald-400 font-medium tracking-wide">LIVE</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
                        <Bell className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="px-5 space-y-6">

                {/* Agent Specific Slider */}
                <div className="w-full h-32 md:h-40 relative rounded-2xl overflow-hidden shadow-lg border border-white/5">
                    <ImageSlider images={[
                        'https://via.placeholder.com/800x300/064e3b/ffffff?text=Boost+Your+Earnings',
                        'https://via.placeholder.com/800x300/0f172a/ffffff?text=Agent+Exclusive+Offer',
                        'https://via.placeholder.com/800x300/4c1d95/ffffff?text=High+Commission+Rates'
                    ]} />
                </div>

                {/* Premium Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-6 shadow-2xl shadow-emerald-900/40"
                >
                    {/* Background Texture */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-emerald-100 text-sm font-medium mb-1 tracking-wide">Available Stock</p>
                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                            ৳{Number(stats.currentBalance || 0).toLocaleString()}
                        </h2>

                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full">
                            <Wallet className="w-3.5 h-3.5 text-emerald-300" />
                            <span className="text-xs font-bold text-white/90">Ready for Transfer</span>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal('topup')}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition group"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition">
                            <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-300">Load Stock</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal('withdraw')}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition group"
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 transition">
                            <ArrowDownLeft className="w-6 h-6 text-rose-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-300">Withdraw</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/agent/history')}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition group"
                    >
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition">
                            <History className="w-6 h-6 text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-300">History</span>
                    </motion.button>
                </div>

                {/* Requests Queue */}
                <div className="pt-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Available Requests
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">{transactions.length}</span>
                        </h3>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                            <RefreshCcw className="w-10 h-10 opacity-50" />
                            <p className="text-sm font-medium">No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {transactions.map((trx, i) => (
                                    <motion.div
                                        key={trx.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${trx.type === 'withdraw' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {trx.type === 'withdraw' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-200 text-sm mb-0.5">{trx.User?.fullName || 'Unknown User'}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-slate-400 font-mono tracking-wide">{trx.User?.phone}</p>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(trx.User?.phone)}
                                                            className="text-slate-600 hover:text-slate-400"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-black ${trx.type === 'withdraw' ? 'text-rose-400' : 'text-blue-400'}`}>
                                                    ৳{Math.abs(trx.amount)}
                                                </p>
                                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 ${trx.type === 'withdraw' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                                                    }`}>
                                                    {trx.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5">
                                            <button
                                                onClick={() => handleAction(trx.id, 'rejected')}
                                                className="py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2"
                                            >
                                                <X className="w-3.5 h-3.5" /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(trx.id, 'completed')}
                                                className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 active:scale-95 transition flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Approve
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1F2937] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-6 capitalize text-center">
                                {showModal === 'topup' ? 'Load Stock' : 'Withdraw Stock'}
                            </h3>
                            <form onSubmit={submitRequest} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                        {showModal === 'topup' ? 'Payment Method' : 'Receive Method'}
                                    </label>
                                    <select
                                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                                        value={method}
                                        onChange={e => setMethod(e.target.value)}
                                    >
                                        <option>Bkash</option>
                                        <option>Nagad</option>
                                        <option>Rocket</option>
                                        <option>Bank Transfer</option>
                                        <option>Hand Cash</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                        {showModal === 'topup' ? 'Transaction ID / Note' : 'Account Details'}
                                    </label>
                                    <textarea
                                        required
                                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                                        value={details}
                                        onChange={e => setDetails(e.target.value)}
                                        placeholder={showModal === 'topup' ? 'Enter TrxID after sending cash to Admin' : 'Enter your wallet number'}
                                        rows={2}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(null)}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AdminBottomNav />
        </div >
    );
}
