'use client';
import { useState } from 'react';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';
import { ArrowLeft, User, Send, Smartphone } from 'lucide-react';
import Link from 'next/link';
import TapToConfirmButton from '../../../components/TapToConfirmButton';

export default function SendMoneyPage() {
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bkash');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [accountType, setAccountType] = useState('Personal'); // Personal or Agent
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConfirm = () => {
        // Trigger the actual submission
        setLoading(true);
        setMessage(''); // Clear previous messages
        setIsError(false);

        // Call the API
        api.post('/transaction/send', {
            recipientPhone: phone,
            amount,
            method,
            accountType
        })
            .then(() => {
                setIsError(false);
                setMessage('Request Sent! 🚀');
                setTimeout(() => router.push('/dashboard'), 2000);
            })
            .catch(err => {
                setIsError(true);
                setMessage(err.response?.data?.message || 'Transaction failed');
                setLoading(false);
            });
    };

    const resetForm = () => {
        setMessage('');
        setIsError(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header - Simple PWA Style */}
            <div className="bg-white p-4 pt-6 shadow-sm z-10 sticky top-0 flex items-center gap-4">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </Link>
                <h1 className="text-lg font-bold text-slate-800">Send Money</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {/* Available Balance Preview (Small) */}
                {/* User requested 'not show', but usually apps show a small hint. 
                    I'll hide it for now based on 'not show' instructions or keep it extremely subtle. 
                    Let's follow the 'not show' strictly for the form focus.
                */}

                {message ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                        <div className={`w-24 h-24 ${isError ? 'bg-red-100/50 ring-red-50' : 'bg-green-100/50 ring-green-50'} rounded-full flex items-center justify-center mb-6 ring-8`}>
                            <span className="text-4xl animate-bounce">{isError ? '⚠️' : '🎉'}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{message}</h2>
                        <p className="text-slate-500">{isError ? 'Please check details and try again.' : 'Your transfer is being processed.'}</p>

                        {isError && (
                            <button
                                onClick={resetForm}
                                className="mt-8 bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="max-w-lg mx-auto space-y-8 py-4">

                        {/* Recipient Input */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recipient</label>
                            <input
                                type="tel"
                                className="w-full text-xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                placeholder="017XXXXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        {/* Amount Input - Huge */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center focus-within:ring-4 focus-within:ring-pink-500/10 transition-all">
                            <label className="block text-xs font-bold text-pink-500 uppercase tracking-widest mb-4">Amount to Send</label>
                            <div className="flex items-center justify-center">
                                <span className="text-4xl font-black text-slate-300 mr-2">৳</span>
                                <input
                                    type="number"
                                    className="w-48 text-5xl font-black text-slate-800 outline-none placeholder:text-slate-200 text-center bg-transparent"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Method</label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="w-full font-bold text-slate-700 outline-none bg-transparent"
                                >
                                    <option value="bkash">Bkash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="rocket">Rocket</option>
                                </select>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                <select
                                    value={accountType}
                                    onChange={(e) => setAccountType(e.target.value)}
                                    className="w-full font-bold text-slate-700 outline-none bg-transparent"
                                >
                                    <option value="Personal">Personal</option>
                                    <option value="Agent">Agent</option>
                                </select>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Tap to Confirm Section */}
            {!message && (
                <div className="bg-white p-6 pb-8 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                    {/* Summary Line */}
                    <div className="flex justify-between items-center mb-8 px-4 text-sm text-slate-500">
                        <span>Total Charge</span>
                        <span className="font-bold text-slate-800">৳0.00</span>
                    </div>

                    <TapToConfirmButton
                        onConfirm={handleConfirm}
                        isLoading={loading}
                        color="pink"
                        initialLabel="Tap and Hold to Send Money"
                        confirmingLabel="Sending..."
                    />
                </div>
            )}
        </div>
    );
}
