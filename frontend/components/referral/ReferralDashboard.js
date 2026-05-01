'use client';
import { useState, useEffect } from 'react';
import { Users, Trophy, DollarSign, Share2, Copy, CheckCircle, Activity, Crown, Star, ChevronRight, Lock, Unlock } from 'lucide-react';
import CommissionHistory from './CommissionHistory';
import api from '../../services/api';
import NetworkEmpire from './NetworkEmpire';
import ShareCard from './ShareCard';
import OrganicTree from './OrganicTree';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../utils/uiUtils';
import { useCurrency } from '../../context/CurrencyContext';

export default function ReferralDashboard() {
    const { formatNXS } = useCurrency();
    const [activeTab, setActiveTab] = useState('overview'); // overview, network, leaderboard, history
    const [level, setLevel] = useState(1);
    const [showEmpire, setShowEmpire] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showOrganic, setShowOrganic] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);
    const [data, setData] = useState({
        stats: { 
            totalEarnings: 0, 
            activeReferrals: 0, 
            totalReferrals: 0, 
            balance: 0,
            pendingReferral: 0,
            empireProgress: 0,
            empireGoal: 20,
            empirePercentage: 0,
            referralHands: 0,
            handProgress: 0,
        },
        logs: [],
        network: [],
        referralCode: ''
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchData();
        if (activeTab === 'leaderboard') fetchLeaderboard();
    }, [activeTab, level]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const dashboardRes = await api.get('/referral/dashboard-data');
            const networkData = await api.get(`/referral/network?level=${level}`);

            setData({
                stats: dashboardRes.data.stats,
                logs: dashboardRes.data.logs,
                referralCode: dashboardRes.data.referralCode,
                network: networkData.data || []
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const { data } = await api.get('/referral/leaderboard');
            setLeaderboard(data);
        } catch (e) {
            console.error(e);
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

    return (
        <div className="space-y-6">
            <NetworkEmpire isOpen={showEmpire} onClose={() => setShowEmpire(false)} />

            {/* 1. Empire Stats Header */}
            <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Empire Revenue</p>
                        <h1 className="text-4xl font-black text-white flex items-baseline gap-1">
                            {formatNXS(data.stats.totalEarnings)}
                            <span className="text-xs text-emerald-400 ml-2">Active</span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowShare(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95">
                            <Share2 className="w-5 h-5 text-indigo-400" />
                        </button>
                        <button onClick={() => setShowEmpire(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95">
                            <Activity className="w-5 h-5 text-amber-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Direct Referrals</p>
                        <p className="text-2xl font-black text-white">{data.stats.totalReferrals}</p>
                    </div>
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Locked Commissions</p>
                        <p className="text-2xl font-black text-amber-400">{formatNXS(data.stats.pendingReferral)}</p>
                    </div>
                </div>

                {/* Invite Code Bar - High Visibility */}
                <div className="mt-8 flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">My Referral Link ID</p>
                        <p className="text-xl font-black text-white tracking-[0.1em] drop-shadow-md">
                            {loading ? 'LOADING...' : (data.referralCode || 'N/A')}
                        </p>
                    </div>
                    <button 
                        onClick={copyCode} 
                        disabled={!data.referralCode}
                        className={`px-8 py-4 rounded-xl font-black text-xs transition-all active:scale-95 shadow-xl ${
                            !data.referralCode ? 'opacity-50 cursor-not-allowed bg-slate-700' :
                            copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                    >
                        {copied ? 'COPIED! ✅' : 'COPY ID'}
                    </button>
                </div>
            </div>

            {/* 2. [NEW] 20-REFERRAL EMPIRE ROADMAP */}
            <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 relative">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-white font-black text-lg tracking-tight">Empire Roadmap</h3>
                        <p className="text-slate-500 text-xs">Reach 20 referrals to unlock the Grand Empire Reward</p>
                    </div>
                    <div className="bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30">
                        <span className="text-xs font-black text-indigo-400">{data.stats.empireProgress}/20</span>
                    </div>
                </div>

                {/* Circular Progress (Visual Focus) */}
                <div className="flex justify-center mb-8 relative">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="80" cy="80" r="70" className="stroke-white/5 fill-none" strokeWidth="12" />
                            <circle 
                                cx="80" cy="80" r="70" 
                                className="stroke-indigo-600 fill-none transition-all duration-1000 ease-out" 
                                strokeWidth="12" 
                                strokeDasharray={440} 
                                strokeDashoffset={440 - (440 * data.stats.empirePercentage) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{Math.round(data.stats.empirePercentage)}%</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                        </div>
                    </div>
                </div>

                {/* Step Roadmap */}
                <div className="relative flex justify-between px-2">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-white/5 -z-10 mx-6"></div>
                    <div className="absolute top-4 left-0 h-1 bg-indigo-600 transition-all duration-1000 -z-10 mx-6" style={{ width: `${data.stats.empirePercentage}%` }}></div>
                    
                    {[0, 5, 10, 15, 20].map((step) => (
                        <div key={step} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                data.stats.empireProgress >= step 
                                ? 'bg-indigo-600 border-[#0f172a] text-white' 
                                : 'bg-[#1e293b] border-[#0f172a] text-slate-600'
                            }`}>
                                {data.stats.empireProgress >= step ? <CheckCircle className="w-4 h-4" /> : <span className="text-[10px] font-black">{step}</span>}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${data.stats.empireProgress >= step ? 'text-indigo-400' : 'text-slate-600'}`}>
                                {step === 0 ? 'Start' : step === 20 ? 'Empire' : `Goal ${step}`}
                            </span>
                        </div>
                    ))}
                </div>

                {data.stats.empireProgress >= 20 && (
                    <div className="mt-8">
                        <button 
                            onClick={() => {
                                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                                toast.success("EMPIRE REWARD UNLOCKED!");
                            }}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black rounded-2xl shadow-xl shadow-amber-500/20 animate-bounce"
                        >
                            CLAIM EMPIRE REWARD 👑
                        </button>
                    </div>
                )}
            </div>

            {/* 3. SOCIAL PROOF: Top Performers Preview */}
            <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5">
                <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" /> Top Performers
                </h3>
                <div className="space-y-3">
                    {leaderboard.slice(0, 3).map((user, idx) => (
                        <div key={user._id} className="bg-white/5 p-3 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                    idx === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{user.username}</p>
                                    <p className="text-[10px] text-slate-500">{user.referralCount} Sales Completed</p>
                                </div>
                            </div>
                            <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <span className="text-[10px] font-black text-emerald-400">${user.referralIncome?.toFixed(0)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar bg-white/5 p-2 rounded-2xl">
                {['overview', 'network', 'leaderboard', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all ${activeTab === tab
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <CommissionHistory logs={data.logs.slice(0, 5)} />
                    </div>
                )}
                {activeTab === 'network' && (
                    <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {[1, 2, 3].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setLevel(lvl)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${level === lvl
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                        }`}
                                >
                                    L{lvl}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {data.network.map(member => (
                                <div key={member._id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{member.fullName}</p>
                                            <p className="text-[10px] text-slate-500">@{member.username}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                                            member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-4">
                        {leaderboard.map((user, idx) => (
                            <div key={user._id} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-500 font-black">#{idx + 1}</span>
                                    <div>
                                        <p className="text-white font-bold">{user.username}</p>
                                        <p className="text-[10px] text-slate-500">{user.referralCount} Members</p>
                                    </div>
                                </div>
                                <p className="text-indigo-400 font-black">${user.referralIncome?.toFixed(0)}</p>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'history' && (
                    <CommissionHistory logs={data.logs} />
                )}
            </div>
        </div>
    );
}
