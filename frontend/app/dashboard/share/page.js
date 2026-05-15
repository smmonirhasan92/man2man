'use client';
import { useState, useEffect } from 'react';
import { Share2, Copy, Trophy, ArrowLeft } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../../utils/uiUtils';
import { useRouter } from 'next/navigation';
import GlobalErrorBoundary from '../../../components/GlobalErrorBoundary';

export default function SharePage() {
    return (
        <GlobalErrorBoundary>
            <ShareContent />
        </GlobalErrorBoundary>
    );
}

function ShareContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [data, setData] = useState({
        referralCode: '',
        empire: { shares: 0, holdBalance: 0 }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/referral/dashboard-data');
            setData({
                referralCode: res.data.referralCode,
                empire: res.data.empire || { shares: 0, holdBalance: 0 }
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        const success = await copyToClipboard(data.referralCode);
        if (success) {
            setCopied(true);
            toast.success("Referral Code Copied!");
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error("Failed to copy code");
        }
    };

    const handleShareAction = async () => {
        try {
            const res = await api.post('/referral/share');
            await api.post('/referral/handshake', { referralCode: data.referralCode });
            
            const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`;
            await copyToClipboard(shareUrl);
            
            if (res.data.alreadyTracked) {
                toast("Link Copied! (Sharing cooldown active)", { icon: '📋' });
            } else {
                toast.success("Empire Influence Increased! Link Copied.");
                fetchData();
            }
        } catch (err) {
            const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`;
            await copyToClipboard(shareUrl);
            toast.success("Referral Link Copied!");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A2540]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A2540] pb-20 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1080')] bg-cover bg-center opacity-10 pointer-events-none"></div>
            
            <div className="w-full max-w-md mx-auto relative z-10 p-6 space-y-6 pt-10">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push('/dashboard')} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-widest uppercase">Marketing</h1>
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Grow Your Network</p>
                    </div>
                </div>

                {/* Main Share Card */}
                <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />
                    
                    <div className="flex flex-col items-center text-center mb-8 relative z-10">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-5 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Share2 className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest">Share & Earn</h3>
                        <p className="text-slate-400 text-xs mt-3 font-medium px-2 leading-relaxed">
                            Turn your social network into an empire. Every active share boosts your influence. Reach <span className="text-white font-black">100 shares</span> to unlock a <span className="text-emerald-400 font-black">200 NXS ($2) Bonus</span>.
                        </p>
                    </div>

                    {/* Invite Code Box */}
                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-indigo-500/20 shadow-inner mb-8 relative z-10 group hover:border-indigo-500/40 transition-all">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Your Secret Link ID</p>
                            <p className="text-xl font-black text-white tracking-[0.15em] truncate">
                                {data.referralCode || 'N/A'}
                            </p>
                        </div>
                        <button 
                            onClick={copyCode} 
                            disabled={!data.referralCode}
                            className={`px-5 py-4 rounded-xl font-black text-xs transition-all shadow-xl flex items-center justify-center ${
                                !data.referralCode ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400' :
                                copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                            }`}
                        >
                            {copied ? <CheckCircle className="w-5 h-5"/> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Progress Tracker */}
                    <div className="mb-8 px-2 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                <Trophy className="w-3 h-3"/> Elite Influence Target
                            </span>
                            <span className="text-sm font-black text-white">{data.empire.shares} / 100</span>
                        </div>
                        <div className="h-4 bg-black/50 rounded-full overflow-hidden p-1 border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                style={{ width: `${Math.min((data.empire.shares / 100) * 100, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-3 text-center uppercase tracking-widest font-bold">
                            {100 - (data.empire.shares || 0)} shares remaining for the bonus payout
                        </p>
                    </div>

                    <button 
                        onClick={handleShareAction}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-3 transition-all active:scale-95 shadow-[0_10px_25px_rgba(99,102,241,0.3)] relative z-10"
                    >
                        <Share2 className="w-5 h-5 animate-bounce" />
                        COPY LINK & SHARE NOW
                    </button>
                </div>
            </div>
        </div>
    );
}
