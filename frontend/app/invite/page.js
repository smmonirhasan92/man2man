'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Copy, Share2, Users, Gift, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
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
        } finally {
            setLoading(false);
        }
    };

    const getInviteLink = () => {
        if (!user?.referral_code) return '';
        // Use window.location.origin to get the current domain dynamically
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/register?ref=${user.referral_code}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getInviteLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Join USA Affiliate Marketing!',
            text: `Join me on USA Affiliate Marketing and earn money! Use my code: ${user?.referral_code}`,
            url: getInviteLink()
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            handleCopy();
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Link href="/dashboard" className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition backdrop-blur-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold">Invite Friends</h1>
                    </div>

                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                            <Gift className="w-10 h-10 text-yellow-300" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Refer & Earn</h2>
                        <p className="text-indigo-100 text-sm max-w-xs mx-auto">
                            Invite your friends and earn rewards when they join and upgrade their account!
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 -mt-8 relative z-20 space-y-6">

                {/* Invite Card */}
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 text-center">
                    <p className="text-slate-500 text-sm font-medium mb-4">Your Unique Invite Link</p>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 break-all">
                        <p className="text-indigo-600 font-mono text-sm font-bold select-all">
                            {getInviteLink()}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition ${copied
                                ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                                : 'bg-slate-900 text-white shadow-lg shadow-slate-200 active:scale-95'
                                }`}
                        >
                            {copied ? <Users className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-95 transition hover:bg-indigo-700"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                    </div>
                </div>

                {/* Stats / Info */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Your Network
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Invites</p>
                            <p className="text-2xl font-bold text-slate-800">{user?.referral_count || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>

                    {/* Tier Info - Can be expanded */}
                    <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Current Tier</p>
                            <span className="px-2 py-0.5 bg-white rounded text-[10px] font-bold text-orange-500 shadow-sm border border-orange-100">
                                {user?.account_tier || 'Starter'}
                            </span>
                        </div>
                        <p className="text-xs text-orange-700/80">
                            Invite more friends to unlock higher tiers and bigger rewards!
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
