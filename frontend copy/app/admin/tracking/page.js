'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, RefreshCw, ShieldAlert, Monitor, Globe, CheckCircle, Ban, Filter, Copy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';

export default function DeviceTrackingPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, duplicate, whitelisted, blocked

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users'); // Ensure backend returns deviceId, lastIp
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Logic to Find Duplicates ---
    const getDuplicateDeviceIds = () => {
        const counts = {};
        users.forEach(u => {
            if (u.deviceId) {
                counts[u.deviceId] = (counts[u.deviceId] || 0) + 1;
            }
        });
        return Object.keys(counts).filter(id => counts[id] > 1);
    };

    const duplicateIds = getDuplicateDeviceIds();

    // --- Filter Logic ---
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.includes(searchTerm) ||
            user.deviceId?.includes(searchTerm) ||
            user.lastIp?.includes(searchTerm);

        if (!matchesSearch) return false;

        if (filter === 'duplicate') return duplicateIds.includes(user.deviceId);
        if (filter === 'whitelisted') return user.isDeviceWhitelisted;
        if (filter === 'blocked') return user.status === 'blocked';

        return true;
    });

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Toast could be added here
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-[#0f172a] text-white p-5 pt-8 md:p-6 md:pb-12 rounded-b-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                <div className="relative z-10 max-w-7xl mx-auto mb-6 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-xl font-bold">Device Tracking</h1>
                    <button onClick={fetchUsers} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition">
                        <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Name, Phone, IP, Device ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        {['all', 'duplicate', 'whitelisted', 'blocked'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all border ${filter === f
                                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-7xl mx-auto px-5 -mt-6 relative z-20">
                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400">Loading tracking data...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <Monitor className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No devices found matching criteria.</p>
                        </div>
                    ) : (
                        filteredUsers.map(user => {
                            const isDuplicate = duplicateIds.includes(user.deviceId);

                            return (
                                <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-md transition-all">

                                    {/* User Info */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${isDuplicate ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {user.fullName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800">{user.fullName || 'Unknown User'}</h3>
                                                {user.isDeviceWhitelisted && (
                                                    <span className="bg-emerald-100 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-emerald-200">Whitelisted</span>
                                                )}
                                                {user.status === 'blocked' && (
                                                    <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-red-200">Blocked</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono">{user.phone}</p>
                                        </div>
                                    </div>

                                    {/* Device & IP Details */}
                                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm">

                                        {/* Device ID */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                <Monitor className="w-3 h-3" /> Device ID
                                            </span>
                                            <div className="flex items-center gap-2 group/copy cursor-pointer" onClick={() => copyToClipboard(user.deviceId)}>
                                                <span className={`font-mono font-medium ${isDuplicate ? 'text-rose-500 font-bold' : 'text-slate-700'}`}>
                                                    {user.deviceId ? `${user.deviceId.substring(0, 16)}...` : 'N/A'}
                                                </span>
                                                {user.deviceId && <Copy className="w-3 h-3 text-slate-300 group-hover/copy:text-blue-500" />}
                                            </div>
                                            {isDuplicate && <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Multi-Account Detected</span>}
                                        </div>

                                        {/* IP Address */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> IP Address
                                            </span>
                                            <span className="font-mono text-slate-700 font-medium">
                                                {user.lastIp || 'Unknown'}
                                            </span>
                                        </div>

                                    </div>

                                    {/* Action Link */}
                                    <div className="flex justify-end">
                                        <Link
                                            href={`/admin/users/detail?id=${user.id}`}
                                            className="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition border border-slate-200"
                                        >
                                            View Details
                                        </Link>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
