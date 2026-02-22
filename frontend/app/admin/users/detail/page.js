'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, ShieldAlert, Monitor, Globe } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function UserDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Actions State
    const [balanceModal, setBalanceModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('credit');
    const [comment, setComment] = useState('');
    const [secKeys, setSecKeys] = useState(['', '', '']); // 3-Layer Security Keys
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchUser();
        } else {
            // If no ID, redirect back
            // router.push('/admin/users');
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/admin/user/${id}`);
            setUser(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            // toast.error("Failed to load user");
            // router.push('/admin/users');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/admin/user/${id}/status`, { status: newStatus });
            fetchUser();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const toggleWhitelist = async () => {
        try {
            await api.patch(`/admin/user/${id}/whitelist`);
            fetchUser();
        } catch (err) {
            toast.error("Failed to toggle whitelist");
        }
    };

    const handleBalanceUpdate = async () => {
        if (!amount) return;

        // Require security keys for credit
        if (type === 'credit' && secKeys.some(k => !k)) {
            return toast.error("All 3 Security Keys are required to add balance.");
        }

        setActionLoading(true);
        try {
            await api.post(`/admin/user/${id}/balance`, {
                amount,
                type,
                comment,
                secKey1: secKeys[0],
                secKey2: secKeys[1],
                secKey3: secKeys[2]
            });
            setBalanceModal(false);
            setAmount('');
            setComment('');
            setSecKeys(['', '', '']);
            fetchUser();
            toast.success("Balance updated successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update balance");
        } finally {
            setActionLoading(false);
        }
    };

    if (!id) return <div className="p-10 text-center">Invalid User ID</div>;
    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <div className="p-10 text-center">User not found</div>;

    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-lg mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/admin/users" className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">{user.fullName}</h1>
                </div>
                <div className="flex gap-4 text-sm text-slate-400 font-mono">
                    <span>{user.phone}</span>
                    <span>|</span>
                    <span>{user.username}</span>
                </div>
            </div>

            <div className="px-4 space-y-6 max-w-4xl mx-auto">

                {/* 1. Status & Whitelist Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" /> Account Security
                    </h2>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Status */}
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Account Status</label>
                            <div className="flex items-center gap-2 mt-2">
                                <select
                                    value={user.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className={`w-full p-3 rounded-xl border-2 font-bold outline-none
                                        ${user.status === 'active' ? 'border-green-200 bg-green-50 text-green-700' : ''}
                                        ${user.status === 'restricted' ? 'border-orange-200 bg-orange-50 text-orange-700' : ''}
                                        ${user.status === 'blocked' ? 'border-red-200 bg-red-50 text-red-700' : ''}
                                    `}
                                >
                                    <option value="active">Active</option>
                                    <option value="restricted">Restricted</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>
                        </div>

                        {/* Whitelist */}
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Multi-Account Check</label>
                            <div className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-100 mt-2">
                                <span className="text-sm font-semibold text-slate-600">
                                    {user.isDeviceWhitelisted ? 'Whitelisted (Bypassed)' : 'Protected (Standard)'}
                                </span>
                                <button
                                    onClick={toggleWhitelist}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.isDeviceWhitelisted ? 'bg-green-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.isDeviceWhitelisted ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">If enabled, this device can create unlimited accounts.</p>
                        </div>
                    </div>
                </div>

                {/* 2. Device Fingerprint */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-500" /> Device Intelligence
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Device ID (Fingerprint)</div>
                            <div className="font-mono text-sm text-slate-700 break-all">{user.deviceId || 'Not Captured'}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Last Known IP
                            </div>
                            <div className="font-mono text-sm text-slate-700">{user.lastIp || 'Unknown'}</div>
                        </div>
                    </div>
                </div>

                {/* 3. Financials */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" /> Financial Control
                    </h2>

                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                        <div>
                            <div className="text-xs text-emerald-600 font-bold uppercase">Main Balance</div>
                            <div className="text-2xl font-black text-emerald-800">৳{user.wallet?.main?.toFixed(2) || '0.00'}</div>
                        </div>
                        <button
                            onClick={() => setBalanceModal(true)}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                        >
                            Adjust Balance
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Income</div>
                            <div className="font-bold">৳{user.wallet?.income?.toFixed(2)}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Game</div>
                            <div className="font-bold">৳{user.wallet?.game?.toFixed(2)}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-[10px] text-slate-400">Purchase</div>
                            <div className="font-bold">৳{user.wallet?.purchase?.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Balance Modal */}
            {balanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Adjust Balance</h3>

                        <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
                            <button
                                onClick={() => setType('credit')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${type === 'credit' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}
                            >
                                Credit (+)
                            </button>
                            <button
                                onClick={() => setType('debit')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${type === 'debit' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}
                            >
                                Debit (-)
                            </button>
                        </div>

                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-3 text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        <textarea
                            placeholder="Admin Comment (Reason)"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                        />

                        {/* 3-Layer Security (Only required for Credit) */}
                        {type === 'credit' && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
                                <h4 className="text-red-600 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Security Authorization
                                </h4>
                                <div className="space-y-2">
                                    {[0, 1, 2].map((i) => (
                                        <input
                                            key={i}
                                            type="password"
                                            placeholder={`Secret Key ${i + 1}`}
                                            value={secKeys[i]}
                                            onChange={(e) => {
                                                const newKeys = [...secKeys];
                                                newKeys[i] = e.target.value;
                                                setSecKeys(newKeys);
                                            }}
                                            className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-center tracking-[0.3em] font-bold text-red-700 outline-none focus:ring-2 focus:ring-red-400"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setBalanceModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                            <button
                                onClick={handleBalanceUpdate}
                                disabled={actionLoading || (type === 'credit' && secKeys.some(k => !k))}
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <UserDetailContent />
        </Suspense>
    );
}
