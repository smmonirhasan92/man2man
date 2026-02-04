'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function LoadPurchasePage() {
    const [user, setUser] = useState(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLoadPurchase = async (e) => {
        e.preventDefault();
        setLoading(true);
        // We reuse the transfer-main logic or create new endpoint? 
        // Currently /wallet/transfer-to-main goes Income -> Purchase (Wait, check name)
        // Previous transferToMain was Income -> Purchase. 
        // We need Main -> Purchase.
        // Let's use a new endpoint or specific payload

        // Actually, let's create a new action endpoint or use a dual-purpose one.
        // For simplicity, I'll mock the endpoint logic here and implement it in backend next step.
        try {
            await api.post('/wallet/load-purchase', { amount });
            setMsg('Transaction Successful: Funds added to Purchase Wallet');
            setTimeout(() => router.push('/dashboard'), 2000);
        } catch (err) {
            setMsg(err.response?.data?.message || 'Transaction Failed');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-10 text-center">Loading...</div>;

    const mainBalance = parseFloat(user.wallet_balance || 0);

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm z-10 sticky top-0">
                <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </Link>
                <h1 className="text-xl font-bold text-slate-800">Load Purchase Wallet</h1>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center mb-8 shadow-lg shadow-indigo-200">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Available Main Balance</p>
                    <h2 className="text-4xl font-bold">৳{mainBalance.toFixed(2)}</h2>
                </div>

                {msg && (
                    <div className={`p-4 rounded-xl mb-6 text-center font-bold text-sm ${msg.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {msg}
                    </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Transfer to Purchase Wallet
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">Move funds from your Main Wallet to Purchase Wallet for shopping or buying plans.</p>

                    <form onSubmit={handleLoadPurchase}>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1">Amount</label>
                            <input
                                type="number"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || mainBalance <= 0}
                            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? 'Processing...' : 'Load Funds'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
