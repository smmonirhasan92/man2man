'use client';
import { useState } from 'react';
import api from '../../services/api';
import { X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderCreationModal({ onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bkash');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !details) return toast.error("Fill all fields");
        setLoading(true);
        try {
            await api.post('/p2p/sell', {
                amount: Number(amount),
                paymentMethod: method,
                paymentDetails: details
            });
            toast.success("Order Created!");
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1f35] border border-white/10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]">
                    <h3 className="font-bold text-white">Create Sell Order</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 uppercase font-bold">Amount to Sell (BDT)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-lg"
                            placeholder="500"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 uppercase font-bold">Receive Via</label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        >
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 uppercase font-bold">Payment Details (Number)</label>
                        <input
                            type="text"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="017XXXXXXXX"
                        />
                    </div>

                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 flex gap-3">
                        <Lock className="w-5 h-5 text-blue-400 shrink-0" />
                        <div className="text-xs text-blue-200">
                            Funds will be <b>locked in escrow</b> immediately. You can cancel anytime before a match is found.
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Lock Funds & Post'}
                    </button>
                </form>
            </div>
        </div>
    );
}
