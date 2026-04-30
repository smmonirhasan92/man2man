'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../services/api';
import Link from 'next/link';
import { ArrowLeft, User, Lock, Hash, CheckCircle, Smartphone, Mail } from 'lucide-react';
import AuthInput from '../../components/ui/AuthInput';
import Button from '../../components/ui/Button';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import useGameSound from '../../hooks/useGameSound';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const refCodeFromUrl = searchParams.get('ref');
    const { playNotification, playSuccess, playError } = useGameSound();

    const [hasMounted, setHasMounted] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        referralCode: '',
        deviceId: '',
        otp: ''
    });

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const [verificationStep, setVerificationStep] = useState('initial'); // initial, verifying, verified
    const [userOtp, setUserOtp] = useState('');
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

    const handleSendOtp = async () => {
        if (!formData.fullName || !formData.email) {
            setError('Please enter your Name and Email first.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Invalid Email Format.');
            return;
        }

        setIsOtpLoading(true);
        setError('');
        
        try {
            await api.post('/auth/send-otp', { email: formData.email, context: 'registration' });
            setVerificationStep('verifying');
            setNotification({ type: 'success', message: 'OTP Sent to Email!' });
            setTimeout(() => setNotification(null), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsOtpLoading(false);
        }
    };

    const verifyOtp = async (code) => {
        try {
            const res = await api.post('/auth/verify-otp', { email: formData.email, otp: code, context: 'registration' });
            if (res.data.verified) {
                setVerificationStep('verified');
                setNotification({ type: 'success', message: 'Email Verified Successfully!' });
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Incorrect Code.');
            setUserOtp('');
        }
    };

    useEffect(() => {
        if (verificationStep === 'verifying' && userOtp.length === 6) {
            verifyOtp(userOtp);
        }
    }, [userOtp, verificationStep]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = { ...formData };

        try {
            const res = await api.post('/auth/register', payload);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                document.cookie = `token=${res.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                
                if (typeof window !== 'undefined') {
                   window.dispatchEvent(new CustomEvent('auth_change'));
                }

                playSuccess();
                router.push(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
            } else { 
                console.error('Registration response missing token:', res.data);
                router.push('/'); 
            }
        } catch (err) {
            console.error('REG_ERROR:', err.response?.data || err.message);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Network Error: Please try again.';
            setError(msg);
            setLoading(false);
            playError();
        }
    };
    return (
        <div className="flex flex-col h-full min-h-screen bg-[#070b14] relative font-sans text-slate-100 overflow-y-auto custom-scrollbar">
            {/* Premium Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top duration-500 flex items-center gap-4 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#131c31] border border-white/10 text-white'}`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
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

                        {/* Direct App Download for Referred Users */}
                        {hasMounted && formData.referralCode && (
                            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Smartphone className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Official App</p>
                                        <p className="text-xs font-bold text-white">Faster & Secure Access</p>
                                    </div>
                                </div>
                                <a
                                    href="https://usaaffiliatemarketing.com/app.apk"
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95"
                                >
                                    GET APK
                                </a>
                            </div>
                        )}
                    </div>

                    {error && <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm font-bold text-center anim-shake">{error}</div>}

                    <form onSubmit={handleRegister} className="space-y-5" autoComplete="off">
                        <input type="hidden" name="username" value={formData.email} />
                         
                        <AuthInput
                            id="register-name"
                            icon={User}
                            label="Identity Name"
                            name="fullName"
                            placeholder="Enter full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            disabled={verificationStep === 'verified'}
                        />

                        <AuthInput
                            id="register-email"
                            icon={Mail}
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            disabled={verificationStep === 'verified'}
                        />

                        <AuthInput id="register-password" icon={Lock} label="Secure Password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required autoComplete="new-password" disabled={verificationStep === 'verified'} />

                        <AuthInput id="register-ref" icon={Hash} label="Referral Code (Optional)" name="referralCode" placeholder="Ref Code" value={formData.referralCode} onChange={handleChange} disabled={verificationStep === 'verified'} />

                        {/* OTP Box */}
                        <div className="bg-[#131c31] rounded-2xl p-5 border border-white/5 mt-4 shadow-inner">
                            {verificationStep === 'initial' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400 font-bold uppercase tracking-wider text-[11px]">Email Verification</span>
                                    <button type="button" onClick={handleSendOtp} disabled={isOtpLoading} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-black tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                        {isOtpLoading ? <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span> : 'GET CODE'}
                                    </button>
                                </div>
                            )}

                            {verificationStep === 'verifying' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Enter 6-Digit Code</span>
                                        <span className="text-emerald-400 animate-pulse">Check your inbox...</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            id="register-otp"
                                            type="text"
                                            maxLength={6}
                                            value={userOtp}
                                            onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="••••••"
                                            className="w-full bg-[#0a1120] border border-white/10 rounded-xl px-4 py-3 text-center text-white font-mono text-2xl tracking-[1em] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                                            autoFocus
                                            autoComplete="one-time-code"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                            )}

                            {verificationStep === 'verified' && (
                                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold py-2 animate-in zoom-in-95">
                                    <CheckCircle className="w-6 h-6" /> EMAIL VERIFIED
                                </div>
                            )}
                        </div>

                        <button
                            id="register-submit"
                            type="submit"
                            disabled={loading || verificationStep !== 'verified'}
                            className={`w-full mt-6 py-4 rounded-2xl font-black tracking-wide text-sm shadow-xl transition-all flex justify-center items-center gap-2 ${verificationStep === 'verified' ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:scale-[1.02] hover:shadow-emerald-500/20 cursor-pointer' : 'bg-[#131c31] text-slate-500 border border-white/5 cursor-not-allowed'}`}
                        >
                            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'FINALIZE REGISTRATION'}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.triggerPWAInstall && window.triggerPWAInstall()}
                            className="w-full py-3 mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all active:scale-95 group"
                        >
                            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download Official App
                        </button>

                        {/* Login Link */}
                        <div className="text-center mt-5">
                            <p className="text-slate-500 text-xs">
                                Already have an account?{' '}
                                <Link href="/login" className="text-emerald-400 font-black hover:text-emerald-300 transition-colors underline underline-offset-2">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return <Suspense fallback={<div className="min-h-screen bg-[#0A2540] flex items-center justify-center text-white">Loading...</div>}><RegisterForm /></Suspense>;
}
