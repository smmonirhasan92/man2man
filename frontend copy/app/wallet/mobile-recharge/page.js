'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, Radio, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import TapToConfirmButton from '../../../components/TapToConfirmButton';
import { authService } from '../../../services/authService';

export default function MobileRechargePage() {
    const [operator, setOperator] = useState(''); // Default empty to force choice
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const router = useRouter();

    const operators = [
        { name: 'Grameenphone', color: '#10b3e8', bg: 'bg-[#10b3e8]' },
        { name: 'Banglalink', color: '#ff6b00', bg: 'bg-[#ff6b00]' },
        { name: 'Robi', color: '#e40000', bg: 'bg-[#e40000]' },
        { name: 'Airtel', color: '#d6001c', bg: 'bg-[#d6001c]' },
        { name: 'Teletalk', color: '#8cbd00', bg: 'bg-[#8cbd00]' }
    ];

    useEffect(() => {
        // Fetch User Balance
        const fetchBalance = async () => {
            try {
                const user = await authService.getCurrentUser();
                setBalance(user.wallet_balance || 0);
            } catch (err) {
                console.error("Failed to fetch balance", err);
            }
        };
        fetchBalance();
    }, []);

    const handleConfirm = () => {
        setError('');
        setMessage('');

        if (!operator) return setError('Please select an operator');
        if (!phone || phone.length < 11) return setError('Invalid phone number');
        if (!amount || parseFloat(amount) < 10) return setError('Minimum recharge is 10 Tk');
        if (parseFloat(amount) > balance) return setError('Insufficient balance');

        setLoading(true);
        api.post('/transaction/mobile-recharge', {
            recipientPhone: phone,
            amount: parseFloat(amount),
            operator
        })
            .then(() => {
                setMessage('Recharge Successful! ⚡');
                setTimeout(() => router.push('/dashboard'), 2000);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Request failed');
                setLoading(false);
            });
    };

    return (
        <div className="h-[100dvh] w-full flex flex-col font-sans overflow-hidden bg-gradient-to-b from-[#2e1065] to-[#111827] text-white">

            {/* Header (Fixed) */}
            <div className="flex-none px-6 py-4 flex items-center gap-4 z-20">
                <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-white" />
                </Link>
                <h1 className="text-xl font-bold tracking-wide">Mobile Recharge</h1>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 w-full max-w-md mx-auto px-6 overflow-y-auto no-scrollbar z-10 pb-6">

                {/* Balance Display */}
                <div className="mb-6 rounded-2xl border border-white/10 p-4 bg-[#1f2937]/50 backdrop-blur-md flex justify-between items-center">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Available Balance</p>
                        <h2 className="text-2xl font-black text-white">৳ {Number(balance).toLocaleString()}</h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <Smartphone className="w-5 h-5" />
                    </div>
                </div>

                {message ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                            <span className="text-4xl">⚡</span>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-400 mb-2">{message}</h2>
                        <p className="text-slate-400 text-sm">Transfer Complete!</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold text-center animate-in fade-in slide-in-from-top-4">
                                {error}
                            </div>
                        )}

                        {/* Main Form Card */}
                        <div className="rounded-3xl border border-cyan-400/50 p-6 space-y-6 shadow-2xl backdrop-blur-md bg-[#111827]/80">

                            {/* Operator Selection */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Operator</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {operators.map(op => (
                                        <button
                                            key={op.name}
                                            onClick={() => setOperator(op.name)}
                                            className={`relative py-3 rounded-xl overflow-hidden transition-all duration-300 ${operator === op.name
                                                    ? 'ring-2 ring-cyan-400 scale-105 shadow-lg'
                                                    : 'bg-[#1f2937] hover:bg-[#374151] border border-white/5 opacity-80 hover:opacity-100'
                                                }`}
                                        >
                                            {/* Colored Top Bar */}
                                            <div className={`absolute top-0 left-0 w-full h-1 ${op.bg}`}></div>
                                            <span className={`text-[10px] font-bold ${operator === op.name ? 'text-white' : 'text-slate-400'}`}>{op.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        className="w-full bg-[#0f172a]/90 border border-white/10 rounded-xl py-4 px-4 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none transition-all pl-12"
                                        placeholder="017XXXXXXXX"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        maxLength={11}
                                    />
                                    <div className="absolute left-4 top-4 text-slate-500 pointer-events-none">
                                        +88
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-[#0f172a]/90 border border-white/10 rounded-xl py-4 px-4 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none transition-all pl-10"
                                        placeholder="Min 10"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                    <span className="absolute left-4 top-4 text-slate-500 font-bold">৳</span>
                                </div>
                            </div>

                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 pb-6">
                            <TapToConfirmButton
                                onConfirm={handleConfirm}
                                isLoading={loading}
                                color="custom"
                                initialLabel="Confirm Recharge"
                                confirmingLabel="Processing..."
                                className="w-full py-4 rounded-xl text-white font-black text-lg uppercase tracking-wider shadow-[0_0_20px_rgba(217,70,239,0.4)] active:scale-95 transition-transform hover:brightness-110"
                                style={{ background: 'linear-gradient(90deg, #d946ef 0%, #ec4899 100%)' }}
                            />
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
