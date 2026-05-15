import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../services/api';
import { KeyRound, LineChart, Search, Wallet, Shield, RefreshCw, MapPin, Monitor, Plus, Minus, Download, Users, Activity, Ban, TrendingUp, Award, Crown, History, Clock } from 'lucide-react';
import USCIcon from './ui/USCIcon';
import RoleDropdown from './admin/RoleDropdown';
import UserProfileModal from './admin/UserProfileModal';
import toast from 'react-hot-toast';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [summary, setSummary] = useState(null);

    // Modals
    const [balanceModal, setBalanceModal] = useState({ show: false, userId: null, type: 'credit', username: '' });

    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Never';
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just Now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [secKeys, setSecKeys] = useState(['', '', '']); // [SECURITY] 3-Layer Keys

    const [resetModal, setResetModal] = useState({ show: false, userId: null, username: '' });
    const [newPassword, setNewPassword] = useState('');

    const [statsModal, setStatsModal] = useState({ show: false, userId: null, username: '' });
    const [profileModal, setProfileModal] = useState({ show: false, userId: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, username: '' });

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, filterCategory]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?search=${searchTerm}&filterCategory=${filterCategory}`);
            // [FIX] Backend returns { users: [], summary: {}, totalPages: ... } now
            if (res.data.users && Array.isArray(res.data.users)) {
                setUsers(res.data.users);
                if (res.data.summary) {
                    setSummary(res.data.summary);
                }
            } else if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                setUsers([]);
            }
            setLoading(false);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load users');
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchUsers();
        setIsRefreshing(false);
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`, {
            style: { background: '#1e293b', color: '#fff', fontSize: '12px' }
        });
    };

    const handleExportCSV = () => {
        if (!users || users.length === 0) {
            toast.error('No users to export');
            return;
        }
        
        // Define CSV headers
        const headers = ['ID', 'Full Name', 'Phone', 'Role', 'Status', 'Main Balance', 'Game Balance', 'Referral Code'];
        
        // Map user data to CSV rows
        const csvRows = users.map(u => [
            u.id || '',
            `"${u.fullName || ''}"`,
            `"${u.phone || u.u_ph || ''}"`,
            u.role || '',
            u.status || 'Active',
            (u.wallet?.main ?? u.w_dat?.m ?? 0).toFixed(2),
            (u.wallet?.game ?? u.w_dat?.g ?? 0).toFixed(2),
            u.referralCode || ''
        ]);
        
        // Join headers and rows
        const csvContent = [
            headers.join(','),
            ...csvRows.map(r => r.join(','))
        ].join('\n');
        
        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `user_database_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Exported Successfully');
    };

    const handleBalanceUpdate = async (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (numAmount > 1000000) {
            toast.error('Safety Limit: Maximum 1,000,000 NXS allowed per manual adjustment to prevent typos.');
            return;
        }
        if (numAmount <= 0) {
            toast.error('Amount must be greater than zero.');
            return;
        }
        try {
            await api.post(`/admin/user/${balanceModal.userId}/balance`, {
                amount,
                type: balanceModal.type,
                comment: note || 'Admin Manual Adjustment',
                secKey1: secKeys[0], // [SECURITY] Include keys
                secKey2: secKeys[1],
                secKey3: secKeys[2]
            });
            toast.success('Balance Updated Successfully');
            setBalanceModal({ show: false, userId: null, type: 'credit', username: '' });
            setAmount('');
            setNote('');
            setSecKeys(['', '', '']); // Reset keys
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update balance');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        try {
            await api.put('/admin/user/role', { userId, role: newRole });
        } catch (err) {
            toast.error('Failed to update role');
            fetchUsers(); // Revert on error
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) return;
        try {
            await api.put('/admin/user/reset-password', { userId: resetModal.userId, newPassword });
            toast.success('Password reset successfully');
            setResetModal({ show: false, userId: null, username: '' });
            setNewPassword('');
        } catch (err) {
            toast.error('Failed to reset password');
        }
    };

    const handleDeleteUser = async () => {
        try {
            await api.delete(`/admin/user/${deleteModal.userId}`);
            toast.success(`User ${deleteModal.username} deleted permanently`);
            setDeleteModal({ show: false, userId: null, username: '' });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'super_admin': return 'Super Admin';
            case 'employee_admin': return 'Employee';
            case 'agent': return 'Agent';
            case 'user': return 'User';
            default: return role;
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
            employee_admin: 'bg-blue-100 text-blue-700 border-blue-200',
            agent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            user: 'bg-slate-100 text-slate-700 border-slate-200'
        };
        return styles[role] || styles.user;
    };

    // Report Card Component for filtering
    const ReportCard = ({ title, value, icon, active, onClick, colorClass }) => (
        <div 
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
                active 
                ? `bg-[#1a1f33] border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105 z-10` 
                : `bg-[#0b1221]/80 border-white/10 hover:border-white/30 hover:bg-[#111827]`
            }`}
        >
            <div className={`flex justify-between items-start mb-2 ${colorClass}`}>
                <div className="p-2 rounded-lg bg-white/5">{icon}</div>
                <div className="text-2xl font-black">{value || 0}</div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
            {/* Clean User Report / Filters */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    <ReportCard title="Total Users" value={summary.totalUsers} icon={<Users className="w-5 h-5" />} active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} colorClass="text-blue-400" />
                    <ReportCard title="Active Users" value={summary.activeUsers} icon={<Activity className="w-5 h-5" />} active={filterCategory === 'active'} onClick={() => setFilterCategory('active')} colorClass="text-emerald-400" />
                    <ReportCard title="Inactive Users" value={summary.inactiveUsers} icon={<Ban className="w-5 h-5" />} active={filterCategory === 'inactive'} onClick={() => setFilterCategory('inactive')} colorClass="text-rose-400" />
                    <ReportCard title="Top 5+ Ref" value={summary.ref5Count} icon={<TrendingUp className="w-5 h-5" />} active={filterCategory === 'top5'} onClick={() => setFilterCategory('top5')} colorClass="text-amber-400" />
                    <ReportCard title="Top 10+ Ref" value={summary.ref10Count} icon={<Award className="w-5 h-5" />} active={filterCategory === 'top10'} onClick={() => setFilterCategory('top10')} colorClass="text-fuchsia-400" />
                    <ReportCard title="Top 20+ Ref" value={summary.ref20Count} icon={<Crown className="w-5 h-5" />} active={filterCategory === 'top20'} onClick={() => setFilterCategory('top20')} colorClass="text-yellow-400" />
                </div>
            )}

            {/* Retention & Live Activity Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:border-emerald-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Today</p>
                                <p className="text-xl font-black text-white">{summary.activeToday || 0} <span className="text-[10px] text-emerald-400 font-bold ml-1 uppercase">(24h Retention)</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:border-indigo-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                <History className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active This Week</p>
                                <p className="text-xl font-black text-white">{summary.activeThisWeek || 0} <span className="text-[10px] text-indigo-400 font-bold ml-1 uppercase">(7d Retention)</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:border-rose-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                                <Clock className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last User Entry</p>
                                <p className="text-lg font-black text-white">
                                    {summary.lastUserActiveAt ? formatTimeAgo(summary.lastUserActiveAt) : 'No Recent Activity'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar & Refresh */}
            <div className="sticky top-4 z-20 mb-6 flex gap-3">
                <div className="relative flex-1 shadow-2xl rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-transparent rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Search by Name, Phone, or Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="p-4 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl hover:bg-white transition flex items-center justify-center text-emerald-600 gap-2 font-bold text-sm"
                        title="Export to CSV"
                    >
                        <Download className="h-5 w-5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        className={`p-4 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl hover:bg-white transition flex items-center justify-center text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && <div className="text-center p-4 bg-red-100 text-red-600 rounded-xl mb-4 font-bold animate-pulse">{error}</div>}

            {/* User List */}
            {/* User List */}
            {loading && !users.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-900/50 animate-pulse rounded-3xl border border-white/5" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {users.map(user => (
                        <div key={user.id} className="bg-[#111] p-6 rounded-3xl shadow-lg border border-white/10 relative group hover:border-indigo-500/30 transition-all duration-300">

                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col gap-6">

                                {/* 1. TOP ROW: Identity & Badges */}
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-black uppercase shadow-lg ${getRoleBadge(user.role)}`}>
                                            {user.fullName ? user.fullName.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <h3 onClick={() => copyToClipboard(user.fullName, 'Name')} title="Click to copy Name" className="text-lg font-bold text-white leading-tight truncate cursor-pointer hover:text-indigo-400 transition-colors">
                                                {user.fullName || 'Unknown User'}
                                            </h3>
                                            <p onClick={() => copyToClipboard(user.phone || user.u_ph, 'Phone/Email')} title="Click to copy Phone/Email" className="text-sm font-mono text-slate-400 mt-0.5 cursor-pointer hover:text-indigo-300 transition-colors">
                                                {user.phone || user.u_ph || 'No Phone'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${getRoleBadge(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${user.status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                            {user.status || 'Active'}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                                            {user.taskData?.accountTier || 'Starter'}
                                        </span>
                                        {user.referralCode && (
                                            <span 
                                                onClick={() => copyToClipboard(user.referralCode, 'Referral Code')} 
                                                className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono border border-white/5 cursor-pointer hover:bg-slate-700 hover:text-white transition-colors" 
                                                title="Click to copy Referral Code"
                                            >
                                                REF: {user.referralCode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. MIDDLE ROW: Financial Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Main Wallet</p>
                                        <p className="text-base sm:text-xl font-black text-white font-mono tracking-tight">
                                            <span className="flex items-center gap-1"><USCIcon className="w-4 h-4" /> {(user.wallet?.main ?? user.w_dat?.m ?? 0).toFixed(2)}</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Game Wallet</p>
                                        <p className="text-base sm:text-xl font-black text-yellow-500 font-mono tracking-tight">
                                            <span className="flex items-center gap-1"><USCIcon className="w-4 h-4" /> {(user.wallet?.game ?? user.w_dat?.g ?? 0).toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* 3. BOTTOM ROW: Actions */}
                                <div className="flex flex-col gap-4">
                                    {/* Money Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setBalanceModal({ show: true, userId: user.id, type: 'credit', username: user.fullName })}
                                            className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-1 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition shadow-lg shadow-emerald-500/20 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" /> Add Fund
                                        </button>
                                        <button
                                            onClick={() => setBalanceModal({ show: true, userId: user.id, type: 'debit', username: user.fullName })}
                                            className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white py-3 px-1 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition shadow-lg shadow-red-500/20 active:scale-95"
                                        >
                                            <Minus className="w-4 h-4" /> Deduct
                                        </button>
                                    </div>

                                    {/* Admin Tools */}
                                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                        <div className="flex-1 min-w-[100px]">
                                            <RoleDropdown
                                                currentRole={user.role}
                                                onChange={(val) => handleRoleChange(user.id, val)}
                                                direction="up"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setProfileModal({ show: true, userId: user.id })}
                                            className="px-3 py-2 bg-indigo-500/20 text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-lg text-xs font-bold uppercase transition shadow-lg shadow-indigo-500/10"
                                            title="View Full Profile & Status"
                                        >
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => setResetModal({ show: true, userId: user.id, username: user.fullName })}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                            title="Reset Password"
                                        >
                                            <KeyRound className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ show: true, userId: user.id, username: user.fullName })}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                            title="Delete User Permanently"
                                        >
                                            <Shield className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                    {!loading && users.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-slate-400 font-medium">No users found matching "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            )}

            {/* Balance Modal and Other Modals */}
            {balanceModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl scale-100">
                        <h3 className="font-extrabold text-xl text-slate-900 mb-1">
                            {balanceModal.type === 'credit' ? 'Add Balance' : 'Deduct Balance'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">Target: <span className="font-bold text-indigo-600">{balanceModal.username}</span></p>

                        <form onSubmit={handleBalanceUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Amount (NXS)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="1000000"
                                    step="0.01"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                                <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> System Limit: Max 1,000,000 NXS per transaction
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Admin Note</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="Reason for adjustment..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>

                            {/* 3-LAYER SECURITY INPUTS (Only for Credits) */}
                            {balanceModal.type === 'credit' && (
                                <div className="space-y-2 mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <label className="block text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> 3-Layer Security Required
                                    </label>
                                    {[0, 1, 2].map((i) => (
                                        <input
                                            key={i}
                                            type="password"
                                            required
                                            placeholder={`Secret Key ${i + 1}`}
                                            className="w-full p-2.5 bg-white border border-red-200 rounded-lg text-sm text-slate-900 text-center tracking-[0.3em] font-mono outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                            value={secKeys[i]}
                                            onChange={(e) => {
                                                const newKeys = [...secKeys];
                                                newKeys[i] = e.target.value;
                                                setSecKeys(newKeys);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setBalanceModal({ show: false }); setSecKeys(['', '', '']); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" className={`flex-1 py-3.5 text-white font-bold rounded-xl transition shadow-lg ${balanceModal.type === 'credit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}>
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="font-extrabold text-xl text-slate-900 mb-6">Reset Password</h3>
                        <input
                            type="text"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 mb-6 transition-all"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setResetModal({ show: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                            <button onClick={handleResetPassword} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">Update</button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Modal */}
            <UserProfileModal
                isOpen={profileModal.show}
                onClose={() => setProfileModal({ show: false, userId: null })}
                userId={profileModal.userId}
                onStatusUpdate={fetchUsers}
            />

            {/* Permanent Deletion Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl overflow-hidden relative">
                        {/* Warning Header */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-red-500"></div>
                        
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner">
                                <Shield className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">System Hazard!</h3>
                            <p className="text-sm text-slate-500 px-4 leading-relaxed">
                                You are about to permanently delete <span className="font-bold text-red-600">{deleteModal.username}</span>. 
                                This will <span className="underline decoration-red-300 decoration-2">BURN</span> their existing balance and clear all records.
                            </p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                            <p className="text-[10px] font-black text-red-700 uppercase tracking-widest text-center">THIS ACTION IS IRREVERSIBLE</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setDeleteModal({ show: false, userId: null, username: '' })}
                                className="py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition active:scale-95"
                            >
                                ABORT
                            </button>
                            <button 
                                onClick={handleDeleteUser}
                                className="py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition active:scale-95"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
