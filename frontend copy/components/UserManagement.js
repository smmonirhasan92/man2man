import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../services/api';
import { KeyRound, LineChart, Search, Wallet, Shield, RefreshCw, MapPin, Monitor, Plus, Minus } from 'lucide-react';
import USCIcon from './ui/USCIcon';
import GameStatsModal from './admin/GameStatsModal';
import RoleDropdown from './admin/RoleDropdown';
import toast from 'react-hot-toast';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modals
    const [balanceModal, setBalanceModal] = useState({ show: false, userId: null, type: 'credit', username: '' });
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const [resetModal, setResetModal] = useState({ show: false, userId: null, username: '' });
    const [newPassword, setNewPassword] = useState('');

    const [statsModal, setStatsModal] = useState({ show: false, userId: null, username: '' });

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?search=${searchTerm}`);
            // [FIX] Backend returns { users: [], totalPages: ... } now
            if (res.data.users && Array.isArray(res.data.users)) {
                setUsers(res.data.users);
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

    const handleBalanceUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/user/${balanceModal.userId}/balance`, {
                amount,
                type: balanceModal.type,
                comment: note || 'Admin Manual Adjustment'
            });
            toast.success('Balance Updated Successfully');
            setBalanceModal({ show: false, userId: null, type: 'credit', username: '' });
            setAmount('');
            setNote('');
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

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
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
                <button
                    onClick={handleRefresh}
                    className={`p-4 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl hover:bg-white transition flex items-center justify-center text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Data"
                >
                    <RefreshCw className="h-6 w-6" />
                </button>
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
                                            <h3 className="text-lg font-bold text-white leading-tight truncate">{user.fullName || 'Unknown User'}</h3>
                                            <p className="text-sm font-mono text-slate-400 mt-0.5">{user.phone || user.u_ph || 'No Phone'}</p>
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
                                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono border border-white/5" title="Referral Code">
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
                                            onClick={() => setResetModal({ show: true, userId: user.id, username: user.fullName })}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                            title="Reset Password"
                                        >
                                            <KeyRound className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setStatsModal({ show: true, userId: user.id, username: user.fullName })}
                                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                                            title="View Stats"
                                        >
                                            <LineChart className="w-5 h-5" />
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
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Amount (BDT)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
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
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setBalanceModal({ show: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
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

            {/* Game Stats Modal */}
            <GameStatsModal
                isOpen={statsModal.show}
                onClose={() => setStatsModal({ show: false, userId: null, username: '' })}
                userId={statsModal.userId}
                username={statsModal.username}
            />
        </div>
    );
}
