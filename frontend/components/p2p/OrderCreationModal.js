'use client';
import { useState } from 'react';
import api from '../../services/api';
import { X, Globe2, Zap, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function OrderCreationModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [adMode, setAdMode] = useState('SELL'); // 'BUY' or 'SELL'
    const [amount, setAmount] = useState(''); // Max Limit
    const [rate, setRate] = useState('126'); // Exchange Rate
    const defaultMethod = user?.country?.toUpperCase() === 'IN' ? 'phonepe' : user?.country?.toUpperCase() === 'BD' ? 'bkash' : 'binance';

    if (!isOpen) return null;
    const [method, setMethod] = useState(defaultMethod);
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const getPaymentMethods = () => {
        return [
            { value: 'bkash', label: 'bKash (BD)' },
            { value: 'nagad', label: 'Nagad (BD)' },
            { value: 'rocket', label: 'Rocket (BD)' },
            { value: 'binance', label: 'Binance Pay (Global)' },
            { value: 'gpay', label: 'Google Pay (IN)' },
            { value: 'phonepe', label: 'PhonePe (IN)' },
            { value: 'paytm', label: 'Paytm (IN)' },
            { value: 'bank', label: 'Bank Transfer' }
        ];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !details || !rate) return toast.error("Fill all fields");
        setLoading(true);
        try {
            await api.post('/p2p/order', {
                type: adMode,
                amount: Number(amount),
                rate: Number(rate),
                paymentMethod: method,
                paymentDetails: details
            });
            toast.success(`${adMode === 'BUY' ? 'Buy' : 'Sell'} Ad Created Successfully!`);
            onSuccess(adMode);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create ad");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-[#0a0f1e] border border-blue-500/20 w-full max-w-sm rounded-[24px] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] mt-10">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]">
                    <h3 className="font-black text-white flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-blue-400" /> Post P2P Ad
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white transition" /></button>
                </div>

                <div className="p-4 bg-[#0a0f1e]">
                    {/* Toggle BUY / SELL AD */}
                    <div className="flex bg-[#111] p-1 rounded-xl mb-2 border border-white/10">
                        <button
                            type="button"
                            onClick={() => setAdMode('BUY')}
                            className={`flex-1 py-3 rounded-lg text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 ${adMode === 'BUY' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-white'}`}
                        >
                            <ArrowDownCircle className="w-4 h-4" /> I WANT TO BUY
                        </button>
                        <button
                            type="button"
                            onClick={() => setAdMode('SELL')}
                            className={`flex-1 py-3 rounded-lg text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 ${adMode === 'SELL' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-white'}`}
                        >
                            <ArrowUpCircle className="w-4 h-4" /> I WANT TO SELL
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

                    <div className={`p-3 rounded-xl border flex gap-3 ${adMode === 'BUY' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <Zap className={`w-5 h-5 shrink-0 ${adMode === 'BUY' ? 'text-blue-400' : 'text-emerald-400'}`} />
                        <div className="text-[10px] text-white/70 leading-relaxed font-bold">
                            {adMode === 'BUY'
                                ? "You are posting an Ad to BUY NXS from other users. You must send them fiat currency to their provided accounts."
                                : "You are posting an Ad to SELL NXS. Your Wallet Balance must cover the limit. Escrow locks funds only when a trade starts."}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Exchange Rate</label>
                            <div className="relative">
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${adMode === 'BUY' ? 'text-blue-500/50' : 'text-emerald-500/50'}`}>1 = </span>
                                <input
                                    type="number"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    className={`w-full bg-[#111927] border border-white/10 rounded-xl p-3 pl-8 font-black focus:outline-none transition ${adMode === 'BUY' ? 'text-blue-400 focus:border-blue-500' : 'text-emerald-400 focus:border-emerald-500'}`}
                                    placeholder="126"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className={`w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white font-bold outline-none transition ${adMode === 'BUY' ? 'focus:border-blue-500' : 'focus:border-emerald-500'}`}
                                placeholder="e.g. 500 NXS"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                            {adMode === 'BUY' ? 'I will pay via' : 'Receive fiat via'}
                        </label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className={`w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white font-bold outline-none transition appearance-none ${adMode === 'BUY' ? 'focus:border-blue-500' : 'focus:border-emerald-500'}`}
                        >
                            {getPaymentMethods().map(pm => (
                                <option key={pm.value} value={pm.value}>{pm.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                            {adMode === 'BUY' ? 'My Account Details' : 'Payment Instructions'}
                        </label>
                        <input
                            type="text"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            className={`w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white outline-none transition font-mono ${adMode === 'BUY' ? 'focus:border-blue-500' : 'focus:border-emerald-500'}`}
                            placeholder="017XXXXXXXX"
                        />
                    </div>

                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-3 items-center">
                        <span className="text-xl">🔥</span>
                        <div className="text-[10px] text-red-200 leading-relaxed font-bold tracking-wide">
                            A <strong className="text-red-400">2% System Burn Fee</strong> is deducted from the Seller when the trade is successfully completed.
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white font-black py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 active:scale-95 uppercase tracking-widest ${adMode === 'BUY'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-900/50'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-900/50'
                            }`}
                    >
                        {loading ? 'Publishing...' : `POST ${adMode} AD`}
                    </button>
                </form>
            </div>
        </div>
    );
}
