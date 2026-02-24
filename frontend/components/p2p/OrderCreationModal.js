'use client';
import { useState } from 'react';
import api from '../../services/api';
import { X, Globe2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderCreationModal({ onClose, onSuccess }) {
    const [amount, setAmount] = useState(''); // Acts as Max Limit
    const [rate, setRate] = useState('126'); // Exchange Rate
    const [method, setMethod] = useState('bkash');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !details || !rate) return toast.error("Fill all fields");
        setLoading(true);
        try {
            await api.post('/p2p/sell', {
                amount: Number(amount),
                rate: Number(rate),
                paymentMethod: method,
                paymentDetails: details
            });
            toast.success("Live Listing Created!");
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create listing");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-[#0a0f1e] border border-emerald-500/20 w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]">
                    <h3 className="font-black text-white flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-emerald-400" /> Enable P2P Selling
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white transition" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex gap-3">
                        <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="text-xs text-emerald-100/80 leading-relaxed">
                            <strong className="text-emerald-400">Live Balance Mode:</strong> Your available wallet balance will be shown to buyers. Funds are <strong className="text-white">only locked when a buyer initiates a trade</strong>.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Exchange Rate</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">1 NXS = </span>
                                <input
                                    type="number"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    className="w-full bg-[#111927] border border-white/10 rounded-xl p-3 pl-20 text-emerald-400 font-black focus:border-emerald-500 outline-none transition"
                                    placeholder="126"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Max Limit (NXS)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white font-bold focus:border-emerald-500 outline-none transition"
                                placeholder="e.g. 500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Receive Via</label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className="w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white font-bold focus:border-emerald-500 outline-none transition appearance-none"
                        >
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Payment Details (Number/Account)</label>
                        <input
                            type="text"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            className="w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition font-mono"
                            placeholder="017XXXXXXXX"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'Publishing...' : 'START SELLING (LIVE)'}
                    </button>
                </form>
            </div>
        </div>
    );
}
