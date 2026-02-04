'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Save, User, LogOut, History, Wallet, Lock, Copy, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ImageCropper from '../../components/profile/ImageCropper';
import TransactionLedger from '../../components/history/TransactionLedger';
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

    const router = useRouter();
    const { logout } = useAuth();
    const [assets, setAssets] = useState([]);

    useEffect(() => {
        api.get('/auth/me')
            .then(res => {
                setUser(res.data);
                setFullName(res.data.fullName);
                if (res.data.photoUrl) setPreview(`https://usaaffiliatemarketing.com/api/${res.data.photoUrl}`);
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
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">

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

                    <div className="mt-4 flex items-center gap-2 bg-gradient-to-r from-blue-900/50 to-red-900/50 border border-white/10 px-6 py-2 rounded-full shadow-inner">
                        <Trophy className={`w-4 h-4 ${user.account_tier === 'Diamond' ? 'text-blue-400' : 'text-yellow-400'}`} />
                        <span className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1">
                            {user.account_tier || 'Standard Member'} <span className="text-red-500">★</span>
                        </span>
                    </div>
                </div>

                {/* 2. REFERRAL CARD - USA STYLE */}
                <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f] to-[#050b14] z-0"></div>
                    {/* Stars Pattern */}
                    <div className="absolute inset-0 opacity-10 z-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full"></div>

                    <div className="relative z-10 p-6 flex flex-col items-center text-center">
                        <Sparkles className="w-6 h-6 text-red-500 mb-2 animate-pulse" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                            Agent Access ID
                        </h3>
                        <p className="text-[10px] text-blue-200/60 mb-4 font-mono">Official USA Affiliate Protocol</p>

                        <button
                            onClick={() => { navigator.clipboard.writeText(user.referral_code); toast.success('Agent ID Copied! 🇺🇸'); }}
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-xl transition-all active:scale-95 w-full justify-center group/btn relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 h-full w-1 bg-red-600"></div>
                            <span className="text-2xl font-mono font-black text-white tracking-[0.15em] relative z-10">{user.referral_code}</span>
                            <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
                            <Copy className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* FIELDS */}
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 w-full bg-slate-800/50 text-white rounded-xl border border-white/10 p-4 font-bold focus:border-blue-500 focus:bg-slate-800 transition outline-none"
                        />
                    </div>

                    {/* ASSETS GRID */}
                    {assets.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2 mb-2">
                                <Wallet className="w-3 h-3" /> Active Assets
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {assets.map((asset, i) => (
                                    <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition group flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">🇺🇸</div>
                                            <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">ACTIVE</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white leading-tight">{asset.planName}</h4>
                                            <p className="text-[10px] font-mono text-slate-400 truncate mt-1">
                                                {asset.syntheticPhone || 'Processing ID...'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Password Section */}
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Lock className="w-3 h-3" /> Security
                        </label>
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={passwords.old}
                            onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                            className="w-full bg-black/20 text-white rounded-lg border border-white/5 p-3 text-sm focus:border-red-500/50 transition outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="password"
                                placeholder="New"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                className="w-full bg-black/20 text-white rounded-lg border border-white/5 p-3 text-sm focus:border-blue-500/50 transition outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Confirm"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                className="w-full bg-black/20 text-white rounded-lg border border-white/5 p-3 text-sm focus:border-blue-500/50 transition outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handlePasswordChange}
                            disabled={passLoading}
                            className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition border border-white/5"
                        >
                            {passLoading ? 'Updating' : 'Update Credentials'}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </form>

                {/* LEDGER SECTION */}
                <div className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction History</h3>
                    </div>
                    {/* Glassmorphism Container handled inside TransactionLedger default styles */}
                    <TransactionLedger />
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
