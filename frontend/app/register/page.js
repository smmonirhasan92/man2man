'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../services/api';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Lock, Hash, CheckCircle, Smartphone } from 'lucide-react';
import AuthInput from '../../components/ui/AuthInput';
import Button from '../../components/ui/Button';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import useGameSound from '../../hooks/useGameSound';

// Premium Country Data with CDN Flag Images
const countries = [
    { name: 'Bangladesh', code: '+880', flagCode: 'bd' },
    { name: 'India', code: '+91', flagCode: 'in' },
    { name: 'Pakistan', code: '+92', flagCode: 'pk' },
    { name: 'United States', code: '+1', flagCode: 'us' },
    { name: 'United Kingdom', code: '+44', flagCode: 'gb' },
    { name: 'Canada', code: '+1', flagCode: 'ca' },
    { name: 'UAE', code: '+971', flagCode: 'ae' },
    { name: 'Saudi Arabia', code: '+966', flagCode: 'sa' },
    { name: 'Malaysia', code: '+60', flagCode: 'my' },
    { name: 'Singapore', code: '+65', flagCode: 'sg' }
];

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const refCodeFromUrl = searchParams.get('ref');
    const { playNotification, playSuccess, playError } = useGameSound();

    // CLEAN STATE: No defaults that look like auto-fill
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        countryCode: '+880',
        password: '',
        referralCode: refCodeFromUrl || '',
        deviceId: '',
        otp: ''
    });

    const [verificationStep, setVerificationStep] = useState('initial');
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [userOtp, setUserOtp] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isOtpLoading, setIsOtpLoading] = useState(false);

    useEffect(() => {
        if (refCodeFromUrl) setFormData(prev => ({ ...prev, referralCode: refCodeFromUrl }));
        const loadFingerprint = async () => {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                setFormData(prev => ({ ...prev, deviceId: result.visitorId }));
            } catch (error) { console.error(error); }
        };
        loadFingerprint();
    }, [refCodeFromUrl]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = () => {
        if (!formData.fullName || !formData.phone) {
            setError('Please enter your Name and Phone Number first.');
            return;
        }
        setIsOtpLoading(true);
        setTimeout(() => {
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            setGeneratedOtp(code);
            setIsOtpLoading(false);
            setVerificationStep('verifying');
            setNotification({ type: 'info', message: `Your Code: ${code}` });
            setTimeout(() => setNotification(null), 10000);
        }, 1500);
    };

    useEffect(() => {
        if (verificationStep === 'verifying' && userOtp.length === 4) {
            if (userOtp === generatedOtp) {
                setVerificationStep('verified');
                setNotification({ type: 'success', message: 'Verified Successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                setError('Incorrect Code.');
                setUserOtp('');
            }
        }
    }, [userOtp, generatedOtp, verificationStep]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            // [REFACTOR] Use primary_phone for API
            primary_phone: `${formData.countryCode}${formData.phone.replace(/^0+/, '')}`,
            country: countries.find(c => c.code === formData.countryCode)?.name || 'Global'
        };

        try {
            const res = await api.post('/auth/register', payload);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                // playSuccess();
                router.push(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
            } else { router.push('/'); }
        } catch (err) {
            // [MOBILE DEBUGGING] - FORCE ALERT TO SEE RAW ERROR


            setError(err.response?.data?.message || 'Registration failed');
            // playError();
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-col h-full min-h-screen bg-[#070b14] relative font-sans text-slate-100 overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top duration-500 flex items-center gap-4 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#131c31] border border-white/10 text-white'}`}>
                    <Smartphone className="w-5 h-5" />
                    <span className="font-mono text-xl font-black tracking-widest">{notification.message}</span>
                </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8 w-full">
                <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>

                <div className="w-full max-w-lg bg-[#0b1221]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

                    <div className="text-center mb-10 mt-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 shadow-2xl mb-4 shadow-emerald-500/20">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white drop-shadow-md tracking-tight">
                            Create Account
                        </h1>
                        <p className="text-slate-400 text-xs font-semibold tracking-widest mt-2 uppercase">USA Affiliate Network</p>
                    </div>

                    {error && <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm font-bold text-center anim-shake">{error}</div>}

                    <form onSubmit={handleRegister} className="space-y-5" autoComplete="off">
                        {/* AutoComplete Off Hack */}
                        <input type="text" style={{ display: 'none' }} />
                        <input type="password" style={{ display: 'none' }} />

                        <AuthInput
                            icon={User}
                            label="Identity Name"
                            name="fullName"
                            placeholder="Enter full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                        />

                        {/* Phone with CDN Flag */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">Authorized Phone</label>
                            <div className="flex gap-2">
                                <div className="relative w-[38%]">
                                    <button type="button" onClick={() => setShowCountryList(!showCountryList)} className="w-full h-full bg-[#131c31] border border-white/5 rounded-2xl rounded-r-none pl-4 pr-3 flex items-center justify-between gap-2 hover:bg-white/5 cursor-pointer transition-colors focus:ring-2 focus:ring-emerald-500/30 outline-none">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://flagcdn.com/w40/${countries.find(c => c.code === formData.countryCode)?.flagCode || 'bd'}.png`}
                                                alt="flag"
                                                className="w-5 h-3.5 rounded-sm object-cover shadow-sm"
                                            />
                                            <span className="text-sm font-bold text-slate-200">{formData.countryCode}</span>
                                        </div>
                                        <svg className={`w-4 h-4 text-slate-500 transition-transform ${showCountryList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>

                                    {showCountryList && (
                                        <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-[#131c31] border border-white/10 rounded-2xl shadow-2xl shadow-black max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 backdrop-blur-xl">
                                            <div className="p-2 sticky top-0 bg-[#131c31]/90 backdrop-blur-sm border-b border-white/5 z-10">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Select Country</p>
                                            </div>
                                            {countries.map(c => (
                                                <div key={c.name} onClick={() => { setFormData({ ...formData, countryCode: c.code }); setShowCountryList(false); }} className="p-3 mx-1 my-1 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between gap-3 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <img src={`https://flagcdn.com/w40/${c.flagCode}.png`} alt={c.name} className="w-6 h-4 rounded-sm shadow-sm" />
                                                        <p className="text-sm font-bold text-white leading-none">{c.name}</p>
                                                    </div>
                                                    <p className="text-xs font-mono text-emerald-400">{c.code}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <AuthInput
                                        icon={Phone}
                                        name="phone"
                                        placeholder="Mobile Number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        className="rounded-l-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <AuthInput icon={Lock} label="Secure Password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required autoComplete="new-password" />

                        <AuthInput icon={Hash} label="Referral Code (Optional)" name="referralCode" placeholder="Ref Code" value={formData.referralCode} onChange={handleChange} />

                        {/* OTP Box */}
                        <div className="bg-[#131c31] rounded-2xl p-5 border border-white/5 mt-4 shadow-inner">
                            {verificationStep === 'initial' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400 font-bold uppercase tracking-wider text-[11px]">Human Verification</span>
                                    <button type="button" onClick={handleSendOtp} disabled={isOtpLoading} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-black tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                        {isOtpLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span> : 'GET CODE'}
                                    </button>
                                </div>
                            )}

                            {verificationStep === 'verifying' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Auto-Verifying Code</span>
                                        <span className="text-emerald-400 animate-pulse">Waiting for input...</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength={4}
                                            value={userOtp}
                                            onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="••••"
                                            className="w-full bg-[#0a1120] border border-white/10 rounded-xl px-4 py-3 text-center text-white font-mono text-2xl tracking-[1em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            {verificationStep === 'verified' && (
                                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold py-2 animate-in zoom-in-95">
                                    <CheckCircle className="w-6 h-6" /> IDENTITY SECURED
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || verificationStep !== 'verified'}
                            className={`w-full mt-6 py-4 rounded-2xl font-black tracking-wide text-sm shadow-xl transition-all flex justify-center items-center gap-2 ${verificationStep === 'verified' ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:scale-[1.02] hover:shadow-emerald-500/20 cursor-pointer' : 'bg-[#131c31] text-slate-500 border border-white/5 cursor-not-allowed'}`}
                        >
                            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'FINALIZE REGISTRATION'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return <Suspense fallback={<div className="min-h-screen bg-[#0A2540] flex items-center justify-center text-white">Loading...</div>}><RegisterForm /></Suspense>;
}
