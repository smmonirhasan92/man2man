'use client';

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Share2, 
    ShieldAlert, 
    CheckCircle, 
    Search, 
    RefreshCcw, 
    Unlock, 
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function AdminReferralEmpire() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({
        totalHold: 0,
        totalShares: 0
    });

    useEffect(() => {
        fetchEmpireData();
    }, []);

    const fetchEmpireData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/empire/users');
            if (res.data.success) {
                setUsers(res.data.users);
                
                // Calculate Stats
                const hold = res.data.users.reduce((acc, u) => acc + (u.referralEmpire?.holdBalance || 0), 0);
                const shares = res.data.users.reduce((acc, u) => acc + (u.referralEmpire?.sharesCount || 0), 0);
                setStats({ totalHold: hold, totalShares: shares });
            }
        } catch (err) {
            toast.error("Failed to load empire data");
        } finally {
            setLoading(false);
        }
    };

    const handleRelease = async (userId, amount) => {
        if (!confirm(`Are you sure you want to release ${amount} NXS to this user?`)) return;
        
        try {
            const res = await api.post('/admin/empire/release', { userId });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchEmpireData(); // Refresh
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to release bonus");
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.fullName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#131c31] p-6 rounded-[2rem] border border-indigo-500/20 shadow-xl flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-600/10 rounded-full blur-2xl" />
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Hold Balance</p>
                        <h3 className="text-3xl font-black text-white mt-1">{stats.totalHold.toFixed(2)} <span className="text-xs text-indigo-500 uppercase">USD</span></h3>
                    </div>
                    <div className="p-4 bg-indigo-500/10 rounded-2xl">
                        <ShieldAlert className="w-8 h-8 text-indigo-400" />
                    </div>
                </div>

                <div className="bg-[#131c31] p-6 rounded-[2rem] border border-amber-500/20 shadow-xl flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-600/10 rounded-full blur-2xl" />
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Empire Shares</p>
                        <h3 className="text-3xl font-black text-white mt-1">{stats.totalShares.toLocaleString()} <span className="text-xs text-amber-500 uppercase">Shares</span></h3>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-2xl">
                        <Share2 className="w-8 h-8 text-amber-400" />
                    </div>
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-[#0f172a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-400" /> EMPIRE MASTER TERMINAL
                    </h3>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Search by username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <button 
                            onClick={fetchEmpireData}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors"
                        >
                            <RefreshCcw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4 text-center">Shares</th>
                                <th className="px-6 py-4 text-center">Joins</th>
                                <th className="px-6 py-4 text-right">Hold Balance</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{user.fullName}</p>
                                                <p className="text-[11px] text-slate-500 italic">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="text-sm font-black text-indigo-400">{user.referralEmpire?.sharesCount || 0}</span>
                                            <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min((user.referralEmpire?.sharesCount || 0), 100)}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-slate-300">{user.referralCount || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-amber-400">${(user.referralEmpire?.holdBalance || 0).toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(user.referralEmpire?.holdBalance || 0) > 0 ? (
                                            <button 
                                                onClick={() => handleRelease(user._id, user.referralEmpire.holdBalance)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 mx-auto transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                            >
                                                <Unlock className="w-3.5 h-3.5" /> RELEASE
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1.5 text-slate-600 font-black text-[10px] uppercase">
                                                <CheckCircle className="w-4 h-4" /> Cleared
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <AlertCircle className="w-12 h-12" />
                                            <p className="font-black uppercase tracking-widest text-xs">No Empire Activity Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
