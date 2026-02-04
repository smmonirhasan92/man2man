'use client';
import { useState, useEffect } from 'react';
import { Users, Trophy, DollarSign, Share2, Copy, CheckCircle, ChevronRight, Activity, Crown } from 'lucide-react';
import CommissionHistory from './CommissionHistory';
import api from '../../services/api';
import NetworkEmpire from './NetworkEmpire';
import ShareCard from './ShareCard';
import OrganicTree from './OrganicTree';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function ReferralDashboard() {
    const [activeTab, setActiveTab] = useState('overview'); // overview, network, leaderboard, history
    const [level, setLevel] = useState(1);
    const [showEmpire, setShowEmpire] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showOrganic, setShowOrganic] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);
    const [data, setData] = useState({
        stats: { totalEarnings: 0, activeReferrals: 0, totalReferrals: 0, balance: 0 },
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

    const copyCode = () => {
        navigator.clipboard.writeText(data.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <NetworkEmpire isOpen={showEmpire} onClose={() => setShowEmpire(false)} />

            {/* 1. Header Card */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                {/* Share Modal */}
                {showShare && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowShare(false)}>
                        <div className="bg-slate-900 border border-amber-500/20 p-6 rounded-3xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-amber-400" /> Share My Empire
                                </h3>
                                <button onClick={() => setShowShare(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>
                            <ShareCard user={{ username: 'Me', referralCode: data.referralCode }} stats={data.stats} />
                        </div>
                    </div>
                )}

                {/* Visualizer Toggles */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button
                        onClick={() => setShowOrganic(!showOrganic)}
                        className={`p-2 rounded-full backdrop-blur-md border border-white/10 transition-transform hover:scale-110 ${showOrganic ? 'bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}
                        title="Toggle Organic Tree"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={showOrganic ? "text-emerald-400" : "text-white"}><path d="M12 10a6 6 0 0 0-6-6s-3 0-3 6c0 6 3 6 3 6s3 0 3 6c0 6 3 6 3 6s3 0 3-6" /></svg>
                    </button>
                    <button
                        onClick={() => setShowEmpire(true)}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/10 transition-transform hover:scale-110"
                        title="View Network Empire"
                    >
                        <Activity className="w-5 h-5 text-yellow-400" />
                    </button>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-indigo-300 text-sm font-medium mb-1">Total Commission Earned</p>
                        <h1 className="text-4xl font-bold text-white">৳{data.stats.totalEarnings?.toFixed(2) || '0.00'}</h1>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="bg-white/10 p-3 rounded-2xl flex-1 md:flex-none backdrop-blur-md">
                            <div className="flex items-center gap-2 text-indigo-200 text-xs mb-1">
                                <Users className="w-3 h-3" /> Team Size
                            </div>
                            <p className="text-xl font-bold text-white">{data.stats.totalReferrals}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-2xl flex-1 md:flex-none backdrop-blur-md border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-300 text-xs mb-1">
                                <Activity className="w-3 h-3" /> Active
                            </div>
                            <p className="text-xl font-bold text-emerald-400">{data.stats.activeReferrals}</p>
                        </div>
                    </div>
                </div>

                {/* Invite Bar */}
                <div className="mt-6 bg-black/20 p-3 rounded-xl flex items-center justify-between backdrop-blur-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-indigo-300 uppercase tracking-wider">My Invite Code</span>
                        <span className="text-lg font-mono font-bold text-white tracking-widest">{data.referralCode || '...'}</span>
                    </div>
                    <button onClick={copyCode} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition active:scale-95 text-white">
                        {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Organic Tree Section */}
            {showOrganic && (
                <div className="mb-6 animate-in fade-in zoom-in duration-500">
                    <OrganicTree />
                </div>
            )}

            {/* Reward Claim (Gamification) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:static md:mt-2 text-center"
                style={{ display: data.stats.balance > 0 ? 'block' : 'none' }}>
                <button
                    onClick={() => {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                        toast.success('Rewards Claimed! (Simulation)');
                    }}
                    className="bg-yellow-400 text-black px-6 py-2 rounded-full font-black shadow-lg shadow-yellow-400/50 hover:scale-105 active:scale-95 transition-transform animate-bounce"
                >
                    CLAIM REWARDS 🎁
                </button>
            </div>

            {/* Share Button (Action) */}
            <div className="flex justify-end -mt-4 mb-4">
                <button
                    onClick={() => setShowShare(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1f2937] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors border border-white/5"
                >
                    <Share2 className="w-3 h-3 text-amber-400" />
                    CREATE VIRAL CARD
                </button>
            </div>

            {/* 2. Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['overview', 'network', 'leaderboard', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-colors ${activeTab === tab
                            ? 'bg-white text-indigo-900 shadow-lg'
                            : 'bg-[#1f2937] text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 3. Tab Content */}
            <div className="min-h-[300px]">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <CommissionHistory logs={data.logs.slice(0, 5)} />
                        <button
                            onClick={() => setActiveTab('history')}
                            className="w-full py-3 text-center text-sm text-indigo-400 font-medium hover:text-indigo-300 border border-dashed border-indigo-500/30 rounded-xl"
                        >
                            View Full History
                        </button>
                    </div>
                )}

                {/* NETWORK TAB */}
                {activeTab === 'network' && (
                    <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {[...Array(10)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setLevel(i + 1)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${level === i + 1
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105'
                                        : 'bg-[#1f2937] text-slate-500 hover:bg-slate-800'
                                        }`}
                                >
                                    L{i + 1}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                            <span>Level {level} Team</span>
                            <span>{data.network.length} Members</span>
                        </div>

                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-center py-10 text-slate-500">Loading Level {level}...</div>
                            ) : data.network.length === 0 ? (
                                <div className="text-center py-10 bg-[#1f2937]/50 rounded-xl border border-dashed border-slate-700">
                                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">No members in Level {level} yet.</p>
                                </div>
                            ) : (
                                data.network.map(member => (
                                    <div key={member._id} className="bg-[#1f2937] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                {member.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{member.fullName}</p>
                                                <p className="text-[10px] text-slate-500">{member.username}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                                }`}>
                                                {member.status}
                                            </span>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Comm: ৳{member.commission?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* LEADERBOARD TAB */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 p-4 rounded-xl border border-amber-500/20 text-center mb-6">
                            <h3 className="text-amber-400 font-bold uppercase text-xs tracking-widest mb-1">Weekly Royal Dividend</h3>
                            <p className="text-white text-sm">Top 3 Empire Builders earn cash bonuses every Sunday!</p>
                        </div>

                        {leaderboard.map((user, idx) => (
                            <div key={user._id || idx} className={`p-4 rounded-xl flex items-center justify-between border ${idx < 3 ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-amber-500/30' : 'bg-[#1f2937] border-white/5'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                                            idx === 1 ? 'bg-slate-400' :
                                                idx === 2 ? 'bg-amber-700' : 'bg-slate-700'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        {idx < 3 && <Crown className="w-4 h-4 text-yellow-400 absolute -top-2 -right-1 rotate-12" />}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold flex items-center gap-2">
                                            {user.username}
                                            {idx === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded border border-yellow-500/30">KING</span>}
                                        </p>
                                        <div className="flex gap-3 text-[10px] text-slate-400">
                                            <span>👥 {user.referralCount} Members</span>
                                            <span>💰 ৳{user.referralIncome?.toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono font-bold text-emerald-400">
                                        {((user.referralCount * 0.6) + (user.referralIncome * 0.4)).toFixed(0)} PTS
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div>
                        <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">All Transactions</h3>
                        <CommissionHistory logs={data.logs} />
                    </div>
                )}
            </div>
        </div >
    );
}
