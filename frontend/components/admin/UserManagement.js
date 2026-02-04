import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Edit, Ban, Key, RefreshCcw, Briefcase, MoreVertical, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionUser, setActionUser] = useState(null);
    const [password, setPassword] = useState('');

    // Quick Action Menu State
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = search ? `?search=${search}` : '';
            const { data } = await api.get(`/admin/users${query}`);
            if (data.users) setUsers(data.users);
            else if (Array.isArray(data)) setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type, payload = {}) => {
        if (!actionUser) return;
        try {
            if (type === 'password') {
                await api.put(`/admin/users/${actionUser._id}/reset-password`, { newPassword: password });
                toast.success('Password Reset Successfully');
            } else if (type === 'status') {
                await api.put(`/admin/users/${actionUser._id}/status`, { status: payload.status });
                fetchUsers();
            } else if (type === 'promote') {
                await api.put(`/admin/users/${actionUser._id}/promote`, { tier: payload.tier });
                fetchUsers();
            }
            setActionUser(null);
        } catch (err) {
            toast.error('Action Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-[#D4AF37]/20 shadow-2xl relative overflow-hidden">
            {/* Royal Glow Effect */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 relative z-10 gap-4">
                <h2 className="text-2xl font-black text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
                    <Briefcase className="w-6 h-6" /> User Management
                </h2>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Premium Table */}
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0a0a]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#151515] text-[#D4AF37] text-xs uppercase tracking-wider border-b border-white/5">
                            <th className="p-4 font-bold">User</th>
                            <th className="p-4 font-bold text-right text-emerald-400">Main Wallet</th>
                            <th className="p-4 font-bold text-right text-yellow-400">Game Wallet</th>
                            <th className="p-4 font-bold text-right text-purple-400">Income</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500 animate-pulse">Loading Royal Database...</td></tr>
                        )}
                        {!loading && users.map(user => (
                            <tr key={user._id} className="hover:bg-white/[0.02] transition-colors text-sm group">
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white text-base">{user.fullName}</span>
                                        <span className="text-xs text-slate-500 font-mono">@{user.username}</span>
                                        <span className="text-[10px] text-slate-600">{user.primary_phone}</span>
                                    </div>
                                </td>

                                {/* 3-Wallet Columns */}
                                <td className="p-4 text-right font-mono text-emerald-400 font-bold bg-emerald-500/5">
                                    ৳{(user.wallet?.main || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-mono text-yellow-500 font-bold bg-yellow-500/5">
                                    ৳{(user.wallet?.game || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-mono text-purple-400 font-bold bg-purple-500/5">
                                    ৳{(user.wallet?.income || 0).toLocaleString()}
                                </td>

                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${user.status === 'active' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                        {user.status}
                                    </span>
                                </td>

                                <td className="p-4 text-center relative">
                                    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                                            className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === user._id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                                <button
                                                    onClick={() => { setActionUser({ ...user, action: 'adjust' }); setOpenMenuId(null); }}
                                                    className="px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2 text-xs font-bold text-white transition"
                                                >
                                                    <Briefcase size={14} className="text-emerald-400" /> Adjust Balance
                                                </button>
                                                <button
                                                    onClick={() => { handleAction('status', { status: user.status === 'active' ? 'blocked' : 'active' }); setOpenMenuId(null); }}
                                                    className="px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2 text-xs font-bold text-white transition"
                                                >
                                                    {user.status === 'active' ? <Ban size={14} className="text-red-400" /> : <CheckCircle size={14} className="text-green-400" />}
                                                    {user.status === 'active' ? 'Block User' : 'Activate User'}
                                                </button>
                                                <button
                                                    onClick={() => { setActionUser({ ...user, action: 'password' }); setOpenMenuId(null); }}
                                                    className="px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2 text-xs font-bold text-white transition"
                                                >
                                                    <Key size={14} className="text-yellow-400" /> Reset Password
                                                </button>
                                                <button
                                                    onClick={() => { setActionUser({ ...user, action: 'promote' }); setOpenMenuId(null); }}
                                                    className="px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2 text-xs font-bold text-white transition"
                                                >
                                                    <ArrowUpRight size={14} className="text-purple-400" /> Manage Tier
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals reused from original structure but restyled */}
            {actionUser && actionUser.action === 'adjust' && (
                <AdjustBalanceModal
                    user={actionUser}
                    onClose={() => setActionUser(null)}
                    onSuccess={() => { setActionUser(null); fetchUsers(); }}
                />
            )}

            {actionUser && actionUser.action === 'password' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#151515] p-6 rounded-2xl border border-[#D4AF37]/30 w-full max-w-sm shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                        <h3 className="text-lg font-bold text-[#D4AF37] mb-4 uppercase tracking-widest">Reset Password</h3>
                        <input
                            type="text"
                            placeholder="New Password"
                            className="w-full bg-black border border-white/10 p-3 rounded-xl mb-4 text-white focus:border-[#D4AF37] outline-none"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setActionUser(null)} className="px-4 py-2 text-slate-400 hover:text-white transition">Cancel</button>
                            <button onClick={() => handleAction('password')} className="px-6 py-2 bg-[#D4AF37] hover:bg-[#b08d26] text-black font-black rounded-xl transition">RESET</button>
                        </div>
                    </div>
                </div>
            )}

            {actionUser && actionUser.action === 'promote' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#151515] p-6 rounded-2xl border border-[#D4AF37]/30 w-full max-w-sm shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                        <h3 className="text-lg font-bold text-[#D4AF37] mb-4 uppercase tracking-widest">Change Tier</h3>
                        <div className="grid grid-cols-1 gap-2 mb-4">
                            {['Standard', 'Premium', 'Platinum'].map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => handleAction('promote', { tier })}
                                    className="p-4 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-xl border border-white/10 text-left text-white transition font-bold"
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setActionUser(null)} className="w-full py-2 text-slate-400 hover:text-white transition">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdjustBalanceModal = ({ user, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('credit');
    const [walletType, setWalletType] = useState('main');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return toast.error('Invalid Amount');
        setLoading(true);
        try {
            await api.post(`/admin/user/${user._id}/balance`, {
                amount: parseFloat(amount),
                type,
                walletType,
                comment
            });
            toast.success('Balance Updated Successfully');
            onSuccess();
        } catch (err) {
            toast.error('Error: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#D4AF37]/30 w-full max-w-md shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-6 uppercase tracking-widest border-b border-white/10 pb-4">
                    Adjust Balance <span className="text-white block text-sm normal-case mt-1 opacity-50">{user.fullName} (@{user.username})</span>
                </h3>

                {/* Wallet Select */}
                <div className="mb-6">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">Target Wallet</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['main', 'game', 'income'].map(w => (
                            <button
                                key={w}
                                onClick={() => setWalletType(w)}
                                className={`py-3 text-xs uppercase font-black rounded-xl border transition-all ${walletType === w
                                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                                    : 'bg-black border-white/10 text-slate-500 hover:border-white/30'
                                    }`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount */}
                <div className="mb-6 relative">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">Amount</label>
                    <input
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white font-black text-2xl focus:border-[#D4AF37] outline-none"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                {/* Action Type */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setType('credit')} className={`p-4 rounded-xl border font-black flex flex-col items-center gap-1 transition-all ${type === 'credit' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black border-white/10 text-slate-500'}`}>
                        <ArrowUpRight size={20} /> ADD FUNDS
                    </button>
                    <button onClick={() => setType('debit')} className={`p-4 rounded-xl border font-black flex flex-col items-center gap-1 transition-all ${type === 'debit' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-black border-white/10 text-slate-500'}`}>
                        <ArrowDownLeft size={20} /> DEDUCT FUNDS
                    </button>
                </div>

                {/* Comment */}
                <input
                    type="text"
                    placeholder="Reason for adjustment..."
                    className="w-full bg-black border border-white/10 p-3 rounded-xl mb-6 text-white text-sm focus:border-[#D4AF37] outline-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold hover:text-white transition" disabled={loading}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-[#D4AF37] hover:bg-[#b08d26] text-black font-black rounded-xl transition shadow-lg shadow-[#D4AF37]/20">
                        {loading ? 'Processing...' : 'CONFIRM ADJUSTMENT'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
