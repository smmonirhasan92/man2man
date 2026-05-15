
import base64
import os

code_content = """'use client';

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Zap, 
    ShieldCheck, 
    Copy, 
    Share2, 
    Trophy, 
    ArrowRight, 
    CheckCircle, 
    Clock, 
    TrendingUp, 
    Gift,
    Target
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const CommissionHistory = ({ logs = [] }) => (
    <div className="space-y-3">
        {logs.map((log, idx) => (
            <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                    <p className="text-white font-bold text-sm">{log.description}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(log.date || log.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-indigo-400 font-black">{log.amount.toLocaleString()} NXS</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {log.status}
                    </span>
                </div>
            </div>
        ))}
    </div>
);

export default function ReferralDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState({
        referralCode: '',
        totalReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        empire: {
            shares: 0,
            holdBalance: 0,
            shareProgress: 0,
            joinProgress: 0,
            isShareBonusClaimed: false,
            isJoinBonusClaimed: false
        },
        network: [],
        logs: []
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [level, setLevel] = useState(1);

    useEffect(() => {
        fetchDashboardData();
        fetchLeaderboard();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/referral/dashboard-data');
            setData(res.data);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to load dashboard");
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/referral/leaderboard');
            setLeaderboard(res.data);
        } catch (err) {}
    };

    const handleShareAction = async () => {
        try {
            const res = await api.post('/referral/share');
            await api.post('/referral/handshake', { referralCode: data.referralCode });
            const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`;
            navigator.clipboard.writeText(shareUrl);
            
            if (res.data.alreadyTracked) {
                toast("Link Copied! (Sharing cooldown active)", { icon: '📋' });
            } else {
                toast.success("Empire Influence Increased! Link Copied.");
                fetchDashboardData();
            }
        } catch (err) {
            const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`;
            navigator.clipboard.writeText(shareUrl);
            toast.success("Referral Link Copied!");
        }
    };

    const formatNXS = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? '0.00 NXS' : `${num.toLocaleString()} NXS`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 rounded-[2.5rem] border border-indigo-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <Users className="w-8 h-8 text-indigo-400 mb-3" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empire Size</p>
                    <h3 className="text-2xl font-black text-white">{data.totalReferrals} <span className="text-xs text-indigo-500 uppercase">Nodes</span></h3>
                </div>

                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 rounded-[2.5rem] border border-amber-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <Trophy className="w-8 h-8 text-amber-400 mb-3" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empire Revenue</p>
                    <h3 className="text-2xl font-black text-white">{formatNXS(data.totalEarnings)}</h3>
                </div>
            </div>

            <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full" />
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                        <Share2 className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic">Elite <span className="text-indigo-500">Influence</span></h3>
                    <p className="text-slate-500 text-xs mt-1 font-medium px-4">Every share increases your empire's reach. 100 shares unlock a 200 NXS ($2) Bonus.</p>
                </div>

                <div className="mb-8 px-2">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Share Progress</span>
                        <span className="text-xs font-black text-white">{data.empire.shares} / 100</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 relative"
                            style={{ width: `${data.empire.shareProgress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center justify-between group">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Your Unique ID</span>
                            <span className="text-lg font-black text-white tracking-widest uppercase">{data.referralCode}</span>
                        </div>
                        <button 
                            onClick={handleShareAction}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            <Copy className="w-4 h-4" />
                            SHARE & BOOST
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] p-8 rounded-[3rem] border-2 border-indigo-500/20 relative">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-wider">Empire <span className="text-red-500">Roadmap</span></h3>
                </div>

                <div className="relative space-y-12">
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-white/5" />
                    <div className="relative pl-12">
                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${data.empire.shares >= 100 ? 'bg-indigo-600 border-indigo-400' : 'bg-[#0f172a] border-white/10'}`}>
                            {data.empire.shares >= 100 ? <CheckCircle className="w-6 h-6 text-white" /> : <TrendingUp className="w-5 h-5 text-slate-600" />}
                        </div>
                        <div className="flex flex-col">
                            <h4 className={`font-black text-sm uppercase ${data.empire.shares >= 100 ? 'text-white' : 'text-slate-500'}`}>Influence Milestone</h4>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Complete 100 Shares to get $2 Bonus</p>
                        </div>
                    </div>

                    <div className="relative pl-12">
                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${data.totalReferrals >= 100 ? 'bg-emerald-600 border-emerald-400' : 'bg-[#0f172a] border-white/10'}`}>
                            {data.totalReferrals >= 100 ? <CheckCircle className="w-6 h-6 text-white" /> : <Users className="w-5 h-5 text-slate-600" />}
                        </div>
                        <div className="flex flex-col">
                            <h4 className={`font-black text-sm uppercase ${data.totalReferrals >= 100 ? 'text-white' : 'text-slate-500'}`}>Expansion Milestone</h4>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">100 Successfull Joins to get $2 Reward</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-white/5 p-5 rounded-[2rem] border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Locked Empire Bonus
                        </p>
                        <h4 className="text-xl font-black text-white mt-1">{data.empire.holdBalance.toFixed(2)} <span className="text-xs text-indigo-500 uppercase">USD</span></h4>
                    </div>
                    <button 
                        onClick={() => toast("Admin will release this bonus after manual audit.", { icon: '🛡️' })}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                    >
                        <ShieldCheck className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

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

            <div className="min-h-[200px]">
                {activeTab === 'network' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {[1, 2, 3].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setLevel(lvl)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${level === lvl ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}
                                >
                                    L{lvl}
                                </button>
                            ))}
                        </div>
                        {data.network.length > 0 ? data.network.map(member => (
                            <div key={member._id} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                        {member.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{member.username}</p>
                                        <p className="text-[10px] text-slate-500">{member.referralCount || 0} Joins</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-10 text-slate-600 text-xs italic">No members found at this level.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
"""

target_path = '/var/www/man2man/frontend/components/referral/ReferralDashboard.js'

with open(target_path, 'w') as f:
    f.write(code_content)

print(f"Successfully updated {target_path} with correct api path.")
