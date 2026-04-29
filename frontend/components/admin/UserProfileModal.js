import { useState, useEffect } from 'react';
import { X, ShieldAlert, Ban, CheckCircle, Activity, MapPin, Calendar, Smartphone, Coins, MessageCircle, Wallet, ShoppingCart } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UserProfileModal({ isOpen, onClose, userId, onStatusUpdate }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        } else {
            setProfile(null);
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/user/${userId}`);
            setProfile(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load user profile");
            onClose();
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!confirm(`Are you sure you want to change this user's status to ${newStatus.toUpperCase()}?`)) return;

        try {
            await api.patch(`/admin/user/${userId}/status`, { status: newStatus });
            toast.success(`User is now ${newStatus}`);
            fetchProfile();
            if (onStatusUpdate) onStatusUpdate(); // Tell parent to refresh list
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const handleDirectMessage = async () => {
        const msg = window.prompt(`Enter message to send ${profile.fullName || 'this user'}:`);
        if (!msg) return;

        try {
            await api.post('/support/admin/initiate', {
                targetUserId: userId,
                message: msg
            });
            toast.success('Message sent! View in Support Panel.');
        } catch (err) {
            console.error(err);
            toast.error("Failed to send message");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 shrink-0">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-indigo-500" />
                        User Details
                    </h2>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading || !profile ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

                        {/* 1. Identity & Status */}
                        <div className="flex flex-col sm:flex-row gap-6 mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg shrink-0">
                                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white mb-1">{profile.fullName || 'No Name'}</h3>
                                <div className="text-slate-400 font-mono text-sm mb-3">{profile.phone || profile.u_ph || 'No Phone'}</div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded-lg border ${profile.status === 'blocked' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                        profile.status === 'restricted' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                                            'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                        }`}>
                                        Status: {profile.status || 'Active'}
                                    </span>
                                    <span className="px-3 py-1 text-[11px] font-bold uppercase rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        Role: {profile.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Key Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Referrals</p>
                                <p className="text-lg font-black text-white">{profile.referrals?.count || 0}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Loyalty</p>
                                <p className="text-lg font-black text-yellow-500">{profile.loyaltyScore || 0}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-indigo-500/20 bg-indigo-500/5">
                                <p className="text-[9px] uppercase font-bold text-indigo-400 mb-1">Self Deposit</p>
                                <p className="text-lg font-black text-emerald-400">${profile.financials?.selfDeposits || 0}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-purple-500/20 bg-purple-500/5">
                                <p className="text-[9px] uppercase font-bold text-purple-400 mb-1">Admin Loan</p>
                                <p className="text-lg font-black text-purple-400">${profile.financials?.adminLoans || 0}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Withdrawn</p>
                                <p className="text-lg font-black text-rose-400">{profile.financials?.totalWithdrawn || 0} NXS</p>
                            </div>
                        </div>

                        {/* [AGENT ONLY] Recovery Progress & Activity Tracking */}
                        {profile.agentAudit && (
                            <div className="mb-8 space-y-4">
                                <div className="p-5 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-[2rem] shadow-xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em]">Agent Recovery Tracker</h4>
                                        <span className="text-[10px] bg-indigo-500/20 px-2 py-1 rounded-full text-indigo-300 font-bold border border-indigo-500/20">
                                            Debt Limit: ${profile.agentAudit.debtLimit || 0}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">Initial Stock</p>
                                            <p className="text-lg font-black text-white">${(profile.agentAudit?.initialDebt || 0).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">P2P Sales (BDT)</p>
                                            <p className="text-lg font-black text-emerald-400">${((profile.agentAudit?.p2pSales || 0) / (profile.financials?.currencyRatio || 50)).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">Remaining Debt</p>
                                            <p className="text-lg font-black text-rose-400">${(profile.agentAudit?.netLiability || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                                            style={{ width: `${Math.min(100, ((profile.agentAudit?.p2pSales || 0) / (profile.agentAudit?.initialDebt * 100 || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* [NEW] Agent Activity & Productivity Metrics */}
                                {profile.agentAudit.activity && (
                                    <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-[1.5rem]">
                                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Merchant Productivity Matrix
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">P2P Orders Sold</p>
                                                <p className="text-xl font-black text-emerald-400">{profile.agentAudit.activity.totalSalesCount || 0}</p>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">P2P Orders Bought</p>
                                                <p className="text-xl font-black text-indigo-400">{profile.agentAudit.activity.totalBuysCount || 0}</p>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
                                                <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">Total Volume (NXS)</p>
                                                <p className="text-xl font-black text-white">{profile.agentAudit.activity.totalVolumeNxs || 0}</p>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center flex flex-col justify-center">
                                                <p className="text-[8px] uppercase font-bold text-slate-400 mb-1">Last Active Sync</p>
                                                <p className="text-[10px] font-bold text-slate-300">
                                                    {profile.agentAudit.activity.lastActive 
                                                        ? new Date(profile.agentAudit.activity.lastActive).toLocaleDateString() 
                                                        : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Deep Financial Accounting */}
                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Financial Ledger Summary</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Total Earned</p>
                                        <Wallet className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <p className="text-xl font-black text-indigo-400">{profile.financials?.totalEarned?.toFixed(2) || 0} NXS</p>
                                    <p className="text-[9px] text-slate-500 mt-1">Rewards ~${((profile.financials?.totalEarned || 0) / (profile.financials?.currencyRatio || 50)).toFixed(2)}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] uppercase font-bold text-slate-500">Total Spent/Purchased</p>
                                        <ShoppingCart className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <p className="text-xl font-black text-amber-400">{profile.financials?.totalSpent?.toFixed(2) || 0} NXS</p>
                                    <p className="text-[9px] text-slate-500 mt-1">Direct Expenses ~${((profile.financials?.totalSpent || 0) / (profile.financials?.currencyRatio || 50)).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">P2P Activity (Sales & Transfers)</p>
                                    <Smartphone className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500">Total Sold (Out)</p>
                                        <p className="text-lg font-black text-rose-400">-{profile.financials?.totalP2PSent?.toFixed(2) || 0} NXS</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-500">Total Received (In)</p>
                                        <p className="text-lg font-black text-emerald-400">+{profile.financials?.totalP2PReceived?.toFixed(2) || 0} NXS</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Net Ecosystem Flow</p>
                                    <p className={`text-sm font-black ${(profile.financials?.p2pNet || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {(profile.financials?.p2pNet || 0) >= 0 ? '+' : ''}{profile.financials?.p2pNet?.toFixed(2) || 0} NXS
                                    </p>
                                </div>
                            </div>

                            {/* Net Settlement Indicator */}
                            <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${(profile.financials?.netAccounting || 0) >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                }`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] uppercase font-bold opacity-70">Accounting Position</p>
                                        <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-bold">1 USD = {profile.financials?.currencyRatio || 50} NXS</span>
                                    </div>
                                    <p className="text-sm font-black">
                                        {profile.financials?.positionLabel || (
                                            (profile.financials?.netAccounting || 0) >= 0
                                            ? "System Owes User (Liability)"
                                            : "User Owes System (Negative Balance)"
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black">${Math.abs(profile.financials?.netAccounting || 0).toFixed(2)}</p>
                                    <p className="text-[9px] opacity-60">Normalized Value (USD)</p>
                                </div>
                            </div>

                            {/* [NEW] ANOMALY ALERT */}
                            {((profile.financials?.netAccounting || 0) > 100) && (
                                <div className="mt-4 p-5 rounded-xl border-2 border-red-500 bg-red-950/40 relative overflow-hidden">
                                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500 blur-2xl opacity-40"></div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-black text-red-400 flex items-center gap-2 uppercase tracking-widest">
                                                <ShieldAlert className="w-5 h-5 animate-pulse" /> ANOMALY DETECTED
                                            </h4>
                                            <p className="text-xs text-red-300 mt-1">User has generated highly abnormal net profits (${(profile.financials?.netAccounting || 0).toFixed(2)}). This is a statistical anomaly.</p>
                                        </div>
                                        <button 
                                            onClick={() => handleStatusChange('restricted')}
                                            disabled={profile.status === 'restricted' || profile.status === 'blocked'}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)] transition whitespace-nowrap shrink-0 disabled:opacity-50"
                                        >
                                            {profile.status === 'restricted' ? 'RESTRICTED' : (profile.status === 'blocked' ? 'BLOCKED' : 'QUICK RESTRICT')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3.5 [NEW] Purchased Packages History */}
                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Purchased Packages (NXS)</h4>
                            <div className="space-y-2">
                                {profile.planHistory && profile.planHistory.length > 0 ? (
                                    profile.planHistory.map((item, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.adminNote || 'Mining Server Purchase'}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-rose-400">-{Math.abs(item.amount).toFixed(0)} NXS</p>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">Completed</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                                        <p className="text-xs text-slate-500">No package documentation found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Security & Metadata List */}
                        <div className="space-y-3 mb-8">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Security & Metadata</h4>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                                <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Last Known IP / Device</p>
                                    <p className="text-sm font-medium text-white font-mono mt-0.5">{profile.lastIp || profile.ipAddress || 'Unknown'} <span className="text-slate-500 ml-2">{profile.deviceId ? `[${profile.deviceId.substring(0, 8)}...]` : ''}</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                                <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Registration Date</p>
                                    <p className="text-sm font-medium text-white mt-0.5">{new Date(profile.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {profile.referredBy && (
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-indigo-500/20">
                                    <Activity className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-indigo-400">Referred By</p>
                                        <p className="text-sm font-medium text-white mt-0.5">{profile.referredBy.fullName} ({profile.referredBy.phone})</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Communication & Admin Actions */}
                        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-5 mb-4">
                            <h4 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2">Direct Communication</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleDirectMessage}
                                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition font-bold"
                                    title="Start a manual support chat with this user"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>Send Message to User</span>
                                </button>
                            </div>
                        </div>

                        {/* 5. Danger Zone */}
                        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-5">
                            <h4 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">Danger Zone</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleStatusChange('active')}
                                    disabled={profile.status === 'active'}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${profile.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                                        }`}
                                >
                                    <CheckCircle className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold uppercase">Activate</span>
                                </button>

                                <button
                                    onClick={() => handleStatusChange('restricted')}
                                    disabled={profile.status === 'restricted'}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${profile.status === 'restricted' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 text-orange-500 hover:bg-orange-500/20 hover:border-orange-500/50'
                                        }`}
                                    title="User can login but cannot transact"
                                >
                                    <ShieldAlert className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold uppercase">Freeze / Restrict</span>
                                </button>

                                <button
                                    onClick={() => handleStatusChange('blocked')}
                                    disabled={profile.status === 'blocked'}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${profile.status === 'blocked' ? 'bg-red-500/10 border-red-500/30 text-red-500 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 text-red-500 hover:bg-red-500/20 hover:border-red-500/50'
                                        }`}
                                    title="User is completely banned and logged out"
                                >
                                    <Ban className="w-6 h-6 mb-2" />
                                    <span className="text-xs font-bold uppercase">Ban Account</span>
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
