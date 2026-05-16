'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, ShieldCheck, Zap, Info, Copy, Check } from 'lucide-react';
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

    // Hold-to-Send State
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const holdDuration = 1500; // 1.5 seconds

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
        if (e) e.preventDefault();
        
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
            // Confetti effect
            const confetti = (await import('canvas-confetti')).default;
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            
            setAmount('');
            setPin('');
            setRecipientId('');
            
            setTimeout(() => router.push('/wallet/history'), 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Transfer failed");
        } finally {
            setLoading(false);
        }
    };

    // Hold-to-Send Effect
    useEffect(() => {
        let interval;
        if (isHolding && !loading) {
            const step = 20; // 50 fps smooth animation
            interval = setInterval(() => {
                setHoldProgress(prev => {
                    const next = prev + (step / holdDuration) * 100;
                    if (next >= 100) {
                        clearInterval(interval);
                        setIsHolding(false);
                        handleSend(); // Trigger send automatically
                        return 100;
                    }
                    return next;
                });
            }, step);
        } else {
            setHoldProgress(0);
        }
        return () => clearInterval(interval);
    }, [isHolding, loading, amount, recipientId, pin]);

    const fee = amount ? (parseFloat(amount) * 0.05).toFixed(2) : 0;
    const total = amount ? (parseFloat(amount) + parseFloat(fee)).toFixed(2) : 0;

    return (
        <div className="h-[100dvh] flex flex-col bg-[#060b18] text-white font-sans selection:bg-pink-500/30 overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Header (Fixed) */}
            <div className="relative z-10 px-5 pt-6 pb-2 flex items-center justify-between shrink-0">
                <Link href="/dashboard" className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50">
                    Direct Send
                </h1>
                <div className="w-9"></div> {/* Spacer */}
            </div>

            {/* Content Area (Scrollable internally if screen is too small, but compact enough to fit) */}
            <div className="relative z-10 px-5 pb-24 flex-1 overflow-y-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* My ID Card (Compact) */}
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-4 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group shrink-0 mt-2">
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Zap className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Your 8-Digit Pay ID</p>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black tracking-tighter">{myId}</h2>
                        <button onClick={copyToClipboard} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Main Balance</span>
                        <span className="text-xs font-black text-emerald-400">{formatNXS(balance)}</span>
                    </div>
                </div>

                {/* Send Form */}
                <div className="space-y-4">
                    
                    {/* Recipient ID */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Recipient Pay ID</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                <Send size={16} />
                            </div>
                            <input 
                                type="text"
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value.replace(/[^0-9]/g, '').trim())}
                                placeholder="e.g. 84492105"
                                maxLength={8}
                                className="w-full bg-white/5 border border-white/10 p-3.5 pl-11 rounded-2xl outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-sm font-black tracking-widest"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Amount (NXS)</label>
                        <div className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center transition-all focus-within:border-pink-500/50">
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
                                placeholder="Enter amount"
                                className="w-full bg-transparent border-none outline-none text-xl font-black text-white placeholder-white/20 cursor-text"
                            />
                        </div>
                        <p className="text-[8px] text-slate-500 font-bold ml-3">Must be multiple of 100</p>
                    </div>

                    {/* Password Section */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Login Password</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                                <ShieldCheck size={16} />
                            </div>
                            <input 
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 p-3.5 pl-11 rounded-2xl outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all text-sm font-black tracking-[0.3em]"
                            />
                        </div>
                    </div>

                    {/* Summary Card (Compact) */}
                    <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Platform Fee (5%)</span>
                            <span className="text-rose-400">{fee} NXS</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                            <span className="text-xs font-black uppercase tracking-widest">Total Deduction</span>
                            <span className="text-sm font-black text-white">{total} NXS</span>
                        </div>
                    </div>

                    {/* Hold to Confirm Button (Compact) */}
                    <div 
                        className="relative w-full h-[54px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer select-none touch-none transition-transform shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] mt-2"
                        style={{ 
                            transform: isHolding ? 'scale(0.96)' : 'scale(1)',
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none'
                        }}
                        onPointerDown={(e) => { 
                            e.preventDefault(); 
                            if(!loading && amount && recipientId && pin) setIsHolding(true); 
                        }}
                        onPointerUp={() => setIsHolding(false)}
                        onPointerLeave={() => setIsHolding(false)}
                        onPointerCancel={() => setIsHolding(false)}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/* Dynamic Progress Fill */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-600 to-purple-600 pointer-events-none transition-all duration-75 ease-linear"
                            style={{ width: `${holdProgress}%` }}
                        ></div>
                        
                        {/* Button Text */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none z-10">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span className={`text-sm font-black uppercase tracking-widest transition-colors ${holdProgress > 40 ? 'text-white drop-shadow-md' : 'text-slate-300'}`}>
                                    Hold to Confirm <Send size={16} className={`inline ml-1 transition-transform ${isHolding ? 'translate-x-1' : ''}`} />
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Important Notice (Compact) */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-2.5 mt-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[9px] text-amber-200/80 font-medium leading-relaxed uppercase tracking-wider">
                        B2B transfers cannot be reversed. Verify ID before confirming. 50 NXS reserve must remain.
                    </p>
                </div>

            </div>
        </div>
    );
}
