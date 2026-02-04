'use client';
import { useState } from 'react';
import api from '../../../services/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AgentWithdrawPage() {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bkash');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/wallet/send', {
                amount,
                recipientPhone: accountNumber,
                method,
                accountType: 'Personal' // Default
            });

            toast.success('Withdrawal request submitted!');
            window.location.href = '/agent/dashboard';
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to request withdrawal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <div className="bg-emerald-600 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 flex items-center gap-4 sticky top-0 z-10">
                <Link href="/agent/dashboard" className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Withdraw</h1>
                    <p className="text-emerald-100 text-xs">Cash out your earnings</p>
                </div>
            </div>

            <div className="p-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <form onSubmit={handleWithdraw} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-2xl font-bold outline-none focus:border-emerald-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Method</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['bkash', 'nagad', 'rocket'].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMethod(m)}
                                        className={`p-3 rounded-xl border font-bold capitalize transition ${method === m ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="017..."
                                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 font-bold"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-black transition disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Request Withdraw'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
