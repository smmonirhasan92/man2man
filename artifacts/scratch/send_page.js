'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, ShieldCheck, Zap, Info, Copy, Check, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCurrency } from '../../../context/CurrencyContext';

export default function B2BSendPage() {
    const { formatNXS } = useCurrency();
    const router = useRouter();

    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [myId, setMyId] = useState('');
    const [copied, setCopied] = useState(false);
    const [balance, setBalance] = useState(0);
    const [showSecretId, setShowSecretId] = useState(false);
    const [showPin, setShowPin] = useState(false);

    // Load User Data (My ID and Balance)
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [userRes, walletRes] = await Promise.all([
                    api.get('/auth/me'),
                    api.get('/wallet/balance')
                ]);
                const userData = userRes.data;
                setMyId(userData.nxsAccountId || 'NXS-PENDING');
                setBalance(walletRes.data.wallet_balance || 0);
            } catch (err) {
                console.error("Failed to load user info", err);
            }
        };
        fetchUserData();
    }, []);

    const copyToClipboard = () => {
        if (!myId || myId === 'NXS-PENDING') return;

        const fallbackCopy = (text) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                toast.success("ID Copied!");
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(myId)
                .then(() => {
                    setCopied(true);
                    toast.success("ID Copied!");
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopy(myId));
        } else {
            fallbackCopy(myId);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        
        const numAmount = parseFloat(amount);
        if (!recipientId || !amount || !pin) return toast.error("Please fill all fields");
        if (numAmount < 900) return toast.error("Minimum send is 900 NXS");
        if (numAmount % 100 !== 0) return toast.error("Amount must be a multiple of 100");

        setLoading(true);
        try {
            const res = await api.post('/wallet/b2b-send', {
                amount: numAmount,
                nxsAccountId: recipientId,
                pin: pin
            });

            toast.success(res.data.message);
            // Confetti effect (optional but nice)
            const confetti = (await import('canvas-confetti')).default;
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            
            setTimeout(() => router.push('/dashboard'), 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Transfer failed");
        } finally {
            setLoading(false);
        }
    };

    const fee = amount ? (parseFloat(amount) * 0.05).toFixed(2) : 0;
    const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : 0;

    return (
        <div className="min-h-screen bg-[#060b18] text-white font-sans selection:bg-pink-500/30">
            {/* Ambient Background Lights */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 pt-8 pb-4 flex items-center justify-between">
                <Link href="/dashboard" className="p-2 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50">
                    Direct Send
                </h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="relative z-10 px-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* My ID Card */}
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Zap className="w-12 h-12 text-indigo-400" />
                    </div>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Your Secret Identity</p>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tighter">
                            {myId === 'NXS-PENDING' 
                                ? myId 
                                : (showSecretId ? myId : myId.replace(/(NXS-)[0-9]+(-[0-9]+)/, '$1****$2'))}
                        </h2>
                        <button onClick={() => setShowSecretId(!showSecretId)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all" title="Toggle Visibility">
                            {showSecretId ? <EyeOff className="w-4 h-4 text-slate-300" /> : <Eye className="w-4 h-4 text-slate-300" />}
                        </button>
                        <button onClick={copyToClipboard} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all" title="Copy Secret ID">
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-bold">Main Balance</span>
                        <span className="text-sm font-black text-emerald-400">{formatNXS(balance)}</span>
                    </div>
                </div>

                {/* Send Form */}
                <form onSubmit={handleSend} className="space-y-6">
                    
                    {/* Recipient ID */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recipient NXS ID</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <Send size={20} />
                            </div>
                            <input 
                                type="text"
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value.toUpperCase())}
                                placeholder="NXS-XXXX-XX"
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-3xl outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-black tracking-widest"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Amount (NXS)</label>
                        <div className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center transition-all focus-within:border-pink-500/50">
                            {/* Honeypot to catch autofill */}
                            <input type="text" style={{ display: 'none' }} name="prevent_autofill" />
                            
                            <input 
                                type="text"
                                inputMode="decimal"
                                id="trx_v_clean"
                                name="trx_v_clean"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setAmount(val);
                                }}
                                onFocus={(e) => e.target.removeAttribute('readonly')}
                                onBlur={(e) => e.target.setAttribute('readonly', 'true')}
                                readOnly
                                autoComplete="off"
                                data-lpignore="true"
                                placeholder="Enter amount in NXS"
                                className="w-full bg-transparent border-none outline-none text-2xl font-black text-white placeholder-white/20 cursor-text"
                            />
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold ml-4">Must be multiple of 100 (e.g. 1000, 1100...)</p>
                    </div>

                    {/* PIN Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Transaction PIN</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                <ShieldCheck size={20} />
                            </div>
                            <input 
                                type={showPin ? "text" : "password"}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••••"
                                maxLength={6}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 pr-14 rounded-3xl outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-black tracking-[0.5em]"
                            />
                            <div 
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-emerald-400 transition-colors"
                                onClick={() => setShowPin(!showPin)}
                            >
                                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>Platform Fee (5%)</span>
                            <span className="text-rose-400">{fee} NXS</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-sm font-black uppercase tracking-widest">Total Deduction</span>
                            <span className="text-xl font-black text-white">{total} NXS</span>
                        </div>
                    </div>

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-3xl font-black uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Confirm Direct Send <Send size={18} /></>
                        )}
                    </button>
                </form>

                {/* Important Notice */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-[10px] text-amber-200/80 font-medium leading-relaxed uppercase tracking-wider">
                        Important: B2B transfers are permanent and cannot be reversed. Always verify the Recipient ID before confirming. A 50 NXS reserve must remain in your wallet.
                    </p>
                </div>

            </div>
        </div>
    );
}
