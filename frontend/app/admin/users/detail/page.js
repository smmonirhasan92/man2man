'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../../../../services/api';
import {
    ArrowLeft, ShieldAlert, Monitor, DollarSign, Globe, Users,
    TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle,
    CheckCircle, XCircle, UserCheck, AlertTriangle, Activity
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ─── Reusable InfoRow ──────────────────────────────────
function InfoRow({ label, value, mono, badge, badgeColor }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
            {badge ? (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor || 'bg-slate-100 text-slate-600'}`}>
                    {value}
                </span>
            ) : (
                <span className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>
                    {value || '—'}
                </span>
            )}
        </div>
    );
}

// ─── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, unit, color, icon: Icon }) {
    return (
        <div className={`rounded-2xl p-4 ${color}`}>
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="w-4 h-4 opacity-70" />}
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
            </div>
            <div className="text-xl font-black">{value}</div>
            {unit && <div className="text-[10px] opacity-60 mt-0.5">{unit}</div>}
        </div>
    );
}

// ─── Section Card ──────────────────────────────────────
function SectionCard({ title, icon: Icon, iconColor, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────
function UserDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [balanceModal, setBalanceModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('credit');
    const [comment, setComment] = useState('');
    const [secKeys, setSecKeys] = useState(['', '', '']);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) fetchUser();
    }, [id]);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/user/${id}`);
            setUser(res.data);
        } catch (err) {
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/admin/user/${id}/status`, { status: newStatus });
            toast.success('Status updated');
            fetchUser();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleBalanceUpdate = async () => {
        if (!amount) return toast.error('Enter an amount');
        if (type === 'credit' && secKeys.some(k => !k)) {
            return toast.error('All 3 Security Keys are required to credit balance');
        }
        setActionLoading(true);
        try {
            await api.post(`/admin/user/${id}/balance`, {
                amount, type, comment,
                secKey1: secKeys[0], secKey2: secKeys[1], secKey3: secKeys[2]
            });
            setBalanceModal(false);
            setAmount(''); setComment(''); setSecKeys(['', '', '']);
            toast.success('Balance updated successfully');
            fetchUser();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update balance');
        } finally {
            setActionLoading(false);
        }
    };

    if (!id) return <div className="p-10 text-center text-slate-500">No user selected.</div>;
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!user) return <div className="p-10 text-center text-red-500">User not found.</div>;

    const fin = user.financials || {};
    const audit = user.agentAudit || {};
    const game = user.gamificationStats || {};

    // Referrer info
    const referrerName = user.referredBy?.fullName || null;
    const referrerPhone = user.referredBy?.primary_phone || null;

    // Status badge color
    const statusColor = {
        active: 'bg-green-100 text-green-700',
        restricted: 'bg-orange-100 text-orange-700',
        blocked: 'bg-red-100 text-red-700',
    }[user.status] || 'bg-slate-100 text-slate-600';

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans">

            {/* ── HEADER ── */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white px-5 pt-5 pb-8 rounded-b-[2rem] shadow-xl mb-5">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/admin/users" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black leading-tight">{user.fullName}</h1>
                        <p className="text-slate-400 text-xs mt-0.5">@{user.username}</p>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-full capitalize ${statusColor}`}>
                        {user.status}
                    </span>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-black">{(user.wallet?.main || 0).toFixed(0)}</div>
                        <div className="text-[10px] text-slate-300 uppercase">Main (NXS)</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-black">{user.referralCount || 0}</div>
                        <div className="text-[10px] text-slate-300 uppercase">Referrals</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-lg font-black">{user.trustScore?.toFixed(1) || '5.0'}</div>
                        <div className="text-[10px] text-slate-300 uppercase">Trust Score</div>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-4 max-w-2xl mx-auto">

                {/* ── 1. IDENTITY ── */}
                <SectionCard title="User Identity" icon={UserCheck} iconColor="text-indigo-500">
                    <InfoRow label="Full Name" value={user.fullName} />
                    <InfoRow label="Username" value={`@${user.username}`} mono />
                    <InfoRow label="Email" value={user.email || 'N/A'} mono />
                    <InfoRow label="Phone" value={user.phone || user.primary_phone || 'N/A'} mono />
                    <InfoRow label="Role" value={user.role?.toUpperCase()} badge badgeColor={user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} />
                    <InfoRow label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                    <InfoRow label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Never'} />
                </SectionCard>

                {/* ── 2. REFERRAL CHAIN (KEY FEATURE) ── */}
                <SectionCard title="Referral Chain" icon={Users} iconColor="text-violet-500">
                    {referrerName ? (
                        <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100 mb-3">
                            <div className="w-9 h-9 rounded-full bg-violet-200 flex items-center justify-center font-black text-violet-700">
                                {referrerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm">{referrerName}</div>
                                <div className="text-xs text-slate-400 font-mono">{referrerPhone || 'No phone'}</div>
                            </div>
                            <span className="ml-auto text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold">Referrer (Upline)</span>
                        </div>
                    ) : (
                        <div className="text-center py-3 text-sm text-slate-400 bg-slate-50 rounded-xl">
                            ⚡ Direct Registration — No referrer
                        </div>
                    )}
                    <InfoRow label="Referral Code" value={user.referralCode || 'N/A'} mono />
                    <InfoRow label="Total Referred Users" value={`${user.referralCount || 0} users`} />
                    <InfoRow label="Total Referral Income" value={`${(user.referralIncome || 0).toFixed(2)} NXS`} />
                </SectionCard>

                {/* ── 3. FINANCIAL AUDIT ── */}
                <SectionCard title="Financial Audit" icon={DollarSign} iconColor="text-emerald-500">

                    {/* Balance Overview */}
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-200 mb-4">
                        <div>
                            <div className="text-xs text-emerald-600 font-bold uppercase mb-1">Main Balance</div>
                            <div className="text-2xl font-black text-emerald-800">{(user.wallet?.main || 0).toFixed(2)} <span className="text-sm font-bold">NXS</span></div>
                        </div>
                        <button
                            onClick={() => setBalanceModal(true)}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                        >
                            Adjust
                        </button>
                    </div>

                    {/* Total Flow Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <StatCard label="Total Deposited" value={`$${fin.selfDeposits?.toFixed(2) || '0.00'}`} unit="Self Deposits (USD)" color="bg-blue-50 text-blue-800" icon={ArrowDownCircle} />
                        <StatCard label="Total Withdrawn" value={`${(fin.totalWithdrawn || 0).toFixed(0)} NXS`} unit="Cash Out" color="bg-red-50 text-red-800" icon={ArrowUpCircle} />
                        <StatCard label="Total Earned" value={`${(fin.totalEarned || 0).toFixed(0)} NXS`} unit="Tasks + Referrals" color="bg-green-50 text-green-800" icon={TrendingUp} />
                        <StatCard label="Admin Credits" value={`$${fin.adminLoans?.toFixed(2) || '0.00'}`} unit="Admin Adjustments" color="bg-orange-50 text-orange-800" icon={AlertTriangle} />
                    </div>

                    {/* Detail Breakdown */}
                    <div className="bg-slate-50 rounded-xl px-4 py-1">
                        <InfoRow label="Income Wallet" value={`${(user.wallet?.income || 0).toFixed(2)} NXS`} />
                        <InfoRow label="Purchase Wallet" value={`${(user.wallet?.purchase || 0).toFixed(2)} NXS`} />
                        <InfoRow label="Escrow Locked" value={`${(user.wallet?.escrow_locked || 0).toFixed(2)} NXS`} />
                        <InfoRow label="P2P Received" value={`${(fin.totalP2PReceived || 0).toFixed(2)} NXS`} />
                        <InfoRow label="P2P Sent" value={`${(fin.totalP2PSent || 0).toFixed(2)} NXS`} />
                        <InfoRow label="Net Platform Position" value={`$${fin.netAccounting?.toFixed(2) || '0.00'}`} />
                    </div>
                </SectionCard>

                {/* ── 4. SECURITY & DEVICE ── */}
                <SectionCard title="Security & Device" icon={ShieldAlert} iconColor="text-indigo-500">
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Account Status</label>
                        <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className={`w-full p-3 rounded-xl border-2 font-bold outline-none text-sm
                                ${user.status === 'active' ? 'border-green-200 bg-green-50 text-green-700' : ''}
                                ${user.status === 'restricted' ? 'border-orange-200 bg-orange-50 text-orange-700' : ''}
                                ${user.status === 'blocked' ? 'border-red-200 bg-red-50 text-red-700' : ''}
                            `}
                        >
                            <option value="active">✅ Active</option>
                            <option value="restricted">⚠️ Restricted</option>
                            <option value="blocked">🚫 Blocked</option>
                        </select>
                    </div>
                    <InfoRow label="KYC Status" value={user.kycStatus?.toUpperCase()} badge badgeColor={user.kycStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} />
                    <InfoRow label="Verified Merchant" value={user.isVerifiedMerchant ? 'Yes' : 'No'} badge badgeColor={user.isVerifiedMerchant ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'} />
                    <InfoRow label="P2P Status" value={user.p2pStatus?.toUpperCase()} badge badgeColor={user.p2pStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} />
                    <InfoRow label="Device Whitelisted" value={user.isDeviceWhitelisted ? 'Yes' : 'No'} badge badgeColor={user.isDeviceWhitelisted ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'} />
                    <InfoRow label="Last IP" value={user.lastIp || 'Unknown'} mono />
                    <InfoRow label="Device ID" value={user.deviceId ? `${user.deviceId.substring(0, 16)}...` : 'Not captured'} mono />
                </SectionCard>

                {/* ── 5. ACTIVITY ── */}
                <SectionCard title="Platform Activity" icon={Activity} iconColor="text-sky-500">
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="P2P Sales" value={audit.activity?.totalSalesCount || 0} unit="orders" color="bg-sky-50 text-sky-800" icon={TrendingUp} />
                        <StatCard label="P2P Buys" value={audit.activity?.totalBuysCount || 0} unit="orders" color="bg-violet-50 text-violet-800" icon={TrendingDown} />
                        <StatCard label="P2P Volume" value={`${(audit.activity?.totalVolumeNxs || 0).toFixed(0)}`} unit="NXS total" color="bg-indigo-50 text-indigo-800" icon={Activity} />
                    </div>
                </SectionCard>

            </div>

            {/* ── BALANCE MODAL ── */}
            {balanceModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl mb-4">
                        <h3 className="text-lg font-black text-slate-800 mb-1">Adjust Balance</h3>
                        <p className="text-xs text-slate-400 mb-4">For: <strong>{user.fullName}</strong></p>

                        <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
                            {['credit', 'debit'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition capitalize ${type === t ? 'bg-white shadow ' + (t === 'credit' ? 'text-green-600' : 'text-red-600') : 'text-slate-400'}`}
                                >
                                    {t === 'credit' ? '+ Credit' : '- Debit'}
                                </button>
                            ))}
                        </div>

                        <input
                            type="number" placeholder="Amount (NXS)" value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-3 text-lg outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <textarea
                            placeholder="Reason / Admin Note" value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-400 resize-none h-20"
                        />

                        {type === 'credit' && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-5">
                                <h4 className="text-red-600 font-bold text-xs uppercase mb-3 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> 3-Layer Security Authorization
                                </h4>
                                <div className="space-y-2">
                                    {[0, 1, 2].map(i => (
                                        <input
                                            key={i} type="password" placeholder={`Secret Key ${i + 1}`}
                                            value={secKeys[i]}
                                            onChange={e => { const k = [...secKeys]; k[i] = e.target.value; setSecKeys(k); }}
                                            className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-center tracking-[0.3em] font-bold text-red-700 outline-none focus:ring-2 focus:ring-red-300"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setBalanceModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                            <button
                                onClick={handleBalanceUpdate}
                                disabled={actionLoading || !amount || (type === 'credit' && secKeys.some(k => !k))}
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                {actionLoading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UserDetailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <UserDetailContent />
        </Suspense>
    );
}
