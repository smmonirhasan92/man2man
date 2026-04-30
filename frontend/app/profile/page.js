'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Save, User, LogOut, History, Wallet, Lock, Copy, Sparkles, Trophy, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ImageCropper from '../../components/profile/ImageCropper';
import ReferralNetworkUI from '../../components/profile/ReferralNetworkUI';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImg, setTempImg] = useState(null);

    // Password State
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);

    // Transaction PIN State
    const [pinData, setPinData] = useState({ password: '', pin: '', confirm: '' });
    const [pinLoading, setPinLoading] = useState(false);

    const [securityOpen, setSecurityOpen] = useState(false);
    const router = useRouter();
    const { logout } = useAuth();
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        api.get('/auth/me')
            .then(res => {
                setUser(res.data);
                setFullName(res.data.fullName);
                if (res.data.photoUrl) setPreview(`https://usaaffiliatemarketing.com/api/${res.data.photoUrl}`);
                
                // [NEW] Fetch Locked Commissions for UX Phase
                api.get('/referral/dashboard-data').then(refRes => {
                    setUser(prev => ({ ...prev, lockedCommissions: refRes.data.lockedCommissions }));
                }).catch(console.error);
            })
            .catch(() => router.push('/'));

        api.get('/plan/my-plans').then(res => setAssets(res.data)).catch(console.error);
    }, [router]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setTempImg(reader.result);
                setShowCropper(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedFile) => {
        setPhoto(croppedFile);
        setPreview(URL.createObjectURL(croppedFile));
        setShowCropper(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('fullName', fullName);
        if (photo) formData.append('photo', photo);

        try {
            const res = await api.put('/user/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Profile Updated! ✅');
            setMessage('Profile Updated Successfully');
            setUser(res.data.user);
        } catch (err) {
            console.error(err);
            toast.error('Update Failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
        if (passwords.new.length < 6) return toast.error('Password too short');

        setPassLoading(true);
        try {
            await api.post('/auth/change-password', { oldPassword: passwords.old, newPassword: passwords.new });
            toast.success('Password Changed Successfully');
            setPasswords({ old: '', new: '', confirm: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally {
            setPassLoading(false);
        }
    };

    const handlePinSetup = async () => {
        if (pinData.pin !== pinData.confirm) return toast.error('PINs do not match');
        if (pinData.pin.length !== 6) return toast.error('PIN must be exactly 6 digits');
        if (!pinData.password) return toast.error('Account Password is required');

        setPinLoading(true);
        try {
            await api.post('/auth/set-pin', { password: pinData.password, pin: pinData.pin });
            toast.success('Transaction PIN Set Successfully! 🔐');
            setPinData({ password: '', pin: '', confirm: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to set PIN');
        } finally {
            setPinLoading(false);
        }
    };

    if (!user) return <div className="flex justify-center items-center min-h-screen bg-slate-900"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div></div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 font-sans overflow-x-hidden">
            {showCropper && <ImageCropper imageSrc={tempImg} onCancel={() => setShowCropper(false)} onCropComplete={handleCropComplete} />}

            {/* HEADER */}
            <div className="bg-black/40 backdrop-blur-xl p-4 flex items-center gap-4 border-b border-white/5 sticky top-0 z-30">
                <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 uppercase">
                    Elite Profile
                </h1>
            </div>

            {/* MAIN SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-48">

                {/* 1. HERO PROFILE SECTION (USA THEME) */}
                <div className="relative flex flex-col items-center">
                    {/* Patriotic Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/30 blur-[60px] rounded-full pointer-events-none"></div>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-600/20 blur-[40px] rounded-full pointer-events-none mix-blend-screen"></div>

                    <div className="relative group">
                        {/* Profile Ring: Red, White, Blue Gradient */}
                        <div className="w-32 h-32 rounded-full p-[4px] bg-gradient-to-tr from-blue-700 via-white to-red-600 shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#0d1b2a] border-2 border-white/10 relative">
                                {preview ? (
                                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <label className="absolute bottom-1 right-1 bg-red-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-red-500 active:scale-95 transition-all border-2 border-[#0d1b2a]">
                            <Camera className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>

                    <h2 className="mt-4 text-3xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
                        {user.fullName || 'Citizen'}
                    </h2>
                    <p className="text-blue-400 text-sm font-bold tracking-widest uppercase">@{user.username}</p>

                    <div className="mt-4 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-900/50 to-red-900/50 border border-white/10 px-6 py-2 rounded-full shadow-inner">
                            <Trophy className={`w-4 h-4 ${user.account_tier === 'Diamond' ? 'text-blue-400' : 'text-yellow-400'}`} />
                            <span className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1">
                                {user.account_tier === 'Agent' ? 'Verified Member' : (user.account_tier || 'Standard Member')} <span className="text-red-500">★</span>
                            </span>
                        </div>
                        {user.min_withdrawal_usd && (
                            <div className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-white/10 shadow-sm backdrop-blur-sm">
                                Minimum Transaction Limit: <span className="text-emerald-400">${user.min_withdrawal_usd}</span> ({(user.min_withdrawal_usd * 100).toFixed(0)} NXS)
                            </div>
                        )}
                    </div>
                </div>

                {/* 1.5 IDENTITY UPDATE FORM */}
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Profile Identity</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Legal Full Name"
                                className="w-full bg-black/40 text-white rounded-xl border border-white/10 p-4 pl-12 text-sm focus:border-blue-500/50 transition outline-none font-bold shadow-inner"
                            />
                        </div>
                    </div>

                    {/* ASSETS GRID (Read Only) */}
                    {assets.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Digital Assets
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {assets.map((asset, i) => (
                                    <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition group flex flex-col gap-2 shadow-lg">
                                        <div className="flex justify-between items-start">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg shadow-inner">🇺🇸</div>
                                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">ACTIVE</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tight">{asset.planName}</h4>
                                            <p className="text-[10px] font-mono text-slate-500 truncate mt-1">
                                                ID: {asset.syntheticPhone || 'SECURE_NODE_PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. EMAIL VERIFICATION / BINDING SECTION [NEW] */}
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Account Security Node
                            </label>
                            {user.email && user.emailVerified ? (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.1)]">Verified ✅</span>
                            ) : (
                                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 font-black tracking-widest uppercase animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.1)]">Verify Required ⚠️</span>
                            )}
                        </div>

                        {!user.email || !user.emailVerified ? (
                            <div className="space-y-4">
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                    {user.email 
                                        ? "Your email is registered but pending verification. Verify to enable withdrawals."
                                        : "Link a professional email to secure your payouts and receive trade notifications."
                                    }
                                </p>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="Enter secure email address"
                                        defaultValue={user.email || ''}
                                        onChange={(e) => setUser({ ...user, tempEmail: e.target.value })}
                                        className="w-full bg-black/50 text-white rounded-xl border border-white/10 p-4 text-sm focus:border-blue-500/50 transition outline-none pr-32 font-bold shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const email = user.tempEmail || user.email;
                                            if (!email) return toast.error('Please enter an email');
                                            try {
                                                await api.post('/auth/send-otp', { email, context: 'verification' });
                                                toast.success('Security Code Sent! 📧');
                                                setUser({ ...user, otpSent: true, tempEmail: email });
                                            } catch (e) { toast.error(e.response?.data?.message || 'Failed to send OTP'); }
                                        }}
                                        className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition border border-blue-500/20"
                                    >
                                        Send OTP
                                    </button>
                                </div>

                                {user.otpSent && (
                                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-500">
                                        <input
                                            type="text"
                                            placeholder="XXXXXX"
                                            maxLength={6}
                                            onChange={(e) => setUser({ ...user, otp: e.target.value })}
                                            className="w-full bg-blue-900/20 text-blue-400 rounded-xl border border-blue-500/30 p-4 text-center text-3xl font-black tracking-[0.5em] focus:border-blue-500 transition outline-none shadow-2xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const res = await api.post('/auth/bind-email', { email: user.tempEmail, otp: user.otp });
                                                    toast.success('Node Secured Successfully! ✨');
                                                    setUser(prev => ({ ...prev, ...res.data.user, otpSent: false }));
                                                } catch (e) { toast.error(e.response?.data?.message || 'Invalid Security Code'); }
                                            }}
                                            className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest transition border border-emerald-500/30 shadow-lg shadow-emerald-900/20"
                                        >
                                            Validate & Link Node
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex items-center justify-between shadow-inner">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Security Email</span>
                                    <span className="text-sm font-black text-white">{user.email}</span>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-lg border border-emerald-500/20">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black text-lg shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/10"
                    >
                        {loading ? 'Processing...' : <><Save className="w-5 h-5" /> Save Profile</>}
                    </button>
                </form>

                {/* REFERRAL NETWORK EMPIRE */}
                <div className="pt-4 pb-2">
                    <ReferralNetworkUI />
                </div>

                {/* [NEW] LOCKED COMMISSIONS SECTION */}
                <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-amber-500" /> Locked Commissions
                        </label>
                        <span className="text-[10px] font-black text-slate-400">5-Day Lock Protocol</span>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 animate-pulse text-slate-600">Scanning Nodes...</div>
                        ) : !user.lockedCommissions || user.lockedCommissions.length === 0 ? (
                            <div className="text-center py-8 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No Locked Assets Found</p>
                            </div>
                        ) : (
                            user.lockedCommissions.map((trx) => {
                                const releaseDate = new Date(trx.metadata?.releaseDate);
                                const isMatured = releaseDate <= new Date();
                                return (
                                    <div key={trx._id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div>
                                            <p className="text-sm font-black text-white">${trx.amount.toFixed(2)}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                                                {isMatured ? 'MATURED ✓' : `RELEASES: ${releaseDate.toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <button
                                            disabled={!isMatured || loading}
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    await api.post('/referral/claim', { transactionId: trx._id });
                                                    toast.success(`Claimed $${trx.amount}! 💰`);
                                                    // Refresh data
                                                    const res = await api.get('/referral/dashboard-data');
                                                    setUser(prev => ({ ...prev, lockedCommissions: res.data.lockedCommissions }));
                                                } catch (e) {
                                                    toast.error(e.response?.data?.message || 'Claim failed');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                                isMatured 
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                                                : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                            }`}
                                        >
                                            {isMatured ? 'CLAIM' : <Lock className="w-3 h-3" />}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* SECURITY SETTINGS — Collapsible Accordion (Bottom) */}
                <div className="border border-white/5 rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setSecurityOpen(v => !v)}
                        className="w-full flex items-center justify-between p-5 bg-slate-800/20 hover:bg-slate-800/40 transition"
                    >
                        <span className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest">
                            <Shield className="w-4 h-4 text-slate-500" /> Account Security
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${securityOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {securityOpen && (
                        <div className="p-5 space-y-6 bg-black/20 border-t border-white/5">
                            {/* Change Password */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Lock className="w-3 h-3 text-red-500/70" /> Change Password
                                </p>
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={passwords.old}
                                    onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                                    className="w-full bg-black/40 text-white rounded-xl border border-white/10 p-3 text-sm focus:border-red-500/50 transition outline-none font-bold"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="password" placeholder="New Password" value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="w-full bg-black/40 text-white rounded-xl border border-white/10 p-3 text-sm focus:border-blue-500/50 transition outline-none font-bold" />
                                    <input type="password" placeholder="Confirm New" value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full bg-black/40 text-white rounded-xl border border-white/10 p-3 text-sm focus:border-blue-500/50 transition outline-none font-bold" />
                                </div>
                                {user.emailVerified && (
                                    <div className="space-y-2 bg-red-900/5 p-3 rounded-xl border border-red-500/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-red-500/70 uppercase tracking-widest">2FA Verification</span>
                                            <button type="button" onClick={async () => {
                                                try {
                                                    await api.post('/auth/send-otp', { email: user.email, context: 'password_reset' });
                                                    toast.success('OTP Sent to your email! 🛡️');
                                                    setPasswords(prev => ({ ...prev, otpSent: true }));
                                                } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
                                            }} className="text-[10px] font-black text-blue-400 uppercase hover:text-blue-300 transition">Send OTP</button>
                                        </div>
                                        <input type="text" placeholder="6-Digit OTP" maxLength={6} value={passwords.otp || ''}
                                            onChange={(e) => setPasswords({ ...passwords, otp: e.target.value })}
                                            className="w-full bg-red-900/20 text-red-400 rounded-xl border border-red-500/20 p-3 text-center text-xl font-black tracking-[0.8em] focus:border-red-500 transition outline-none" />
                                    </div>
                                )}
                                <button type="button" onClick={handlePasswordChange} disabled={passLoading}
                                    className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition border border-white/10 active:scale-95">
                                    {passLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>

                            <div className="border-t border-white/5" />

                            {/* P2P PIN */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Lock className="w-3 h-3 text-emerald-500/70" /> P2P Transaction PIN
                                </p>
                                <p className="text-[11px] text-slate-600 leading-tight">A 6-digit PIN required to confirm all P2P fund releases.</p>
                                <input type="password" placeholder="Account Password (to verify it's you)"
                                    value={pinData.password} onChange={(e) => setPinData({ ...pinData, password: e.target.value })}
                                    className="w-full bg-black/40 text-white rounded-xl border border-emerald-500/10 p-3 text-sm focus:border-emerald-500/30 transition outline-none font-bold" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="password" maxLength={6} placeholder="New PIN"
                                        value={pinData.pin} onChange={(e) => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, '') })}
                                        className="w-full bg-black/40 text-emerald-400 rounded-xl border border-emerald-500/10 p-3 text-center text-xl font-black tracking-[0.5em] focus:border-emerald-500/30 transition outline-none" />
                                    <input type="password" maxLength={6} placeholder="Confirm PIN"
                                        value={pinData.confirm} onChange={(e) => setPinData({ ...pinData, confirm: e.target.value.replace(/\D/g, '') })}
                                        className="w-full bg-black/40 text-emerald-400 rounded-xl border border-emerald-500/10 p-3 text-center text-xl font-black tracking-[0.5em] focus:border-emerald-500/30 transition outline-none" />
                                </div>
                                <button type="button" onClick={handlePinSetup} disabled={pinLoading}
                                    className="w-full py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest transition border border-emerald-500/20 active:scale-95">
                                    {pinLoading ? 'Saving...' : 'Set P2P PIN'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* LOGOUT */}
                <button
                    onClick={logout}
                    className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Log Out
                </button>
            </div>
        </div>
    );
}
