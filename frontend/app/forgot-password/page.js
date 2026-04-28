'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, CheckCircle, ShieldAlert } from 'lucide-react';
import AuthInput from '../../components/ui/AuthInput';

function ForgotPasswordForm() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    
    // Form Data
    const [identifier, setIdentifier] = useState(''); // Email or old Phone
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!identifier) {
            setError('Please enter your email or phone number.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/forgot-password', { identifier });
            setSentEmail(res.data.email); // The backend returns the email it sent to
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code. Make sure you have linked an email.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { email: sentEmail, otp, context: 'password_reset' });
            if (res.data.verified) {
                setStep(3);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { email: sentEmail, otp, newPassword });
            setStep(4);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#070b14] relative font-sans text-slate-100 items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <Link href="/login" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors z-20">
                <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>

            <div className="w-full max-w-md bg-[#0b1221]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl p-8 relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500/20 to-orange-500/20 border border-red-500/20 mb-4">
                        <ShieldAlert className="w-7 h-7 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-wider">Account Recovery</h1>
                    <p className="text-slate-400 text-xs font-semibold mt-2">USA Affiliate Network</p>
                </div>

                {error && <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm font-bold text-center anim-shake">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm text-slate-300 text-center mb-4">Enter your registered email address to receive a password reset code.</p>
                        <AuthInput
                            id="reset-id"
                            icon={Mail}
                            name="identifier"
                            type="text"
                            placeholder="Email Address (or Old Phone)"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:brightness-110 flex justify-center items-center">
                            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'Send Recovery Code'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-2">
                        <p className="text-sm text-slate-300 text-center mb-4">We sent a 6-digit code to <span className="text-orange-400 font-bold">{sentEmail}</span></p>
                        <div className="flex justify-center">
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••••"
                                className="w-full bg-[#131c31] border border-white/10 rounded-2xl px-4 py-4 text-center text-white font-mono text-3xl tracking-[0.5em] outline-none focus:border-orange-500 transition-colors"
                                autoFocus
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-4 mt-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:brightness-110 flex justify-center items-center disabled:opacity-50">
                            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'Verify Code'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-right-2">
                        <AuthInput id="new-pass" icon={Lock} type="password" name="newPassword" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                        <AuthInput id="confirm-pass" icon={Lock} type="password" name="confirmPassword" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        
                        <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:brightness-110 flex justify-center items-center">
                            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'Set New Password'}
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <div className="text-center py-6 animate-in zoom-in-95">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-white">PASSWORD RESET</h2>
                        <p className="text-slate-400 mt-2">You can now login with your new password.</p>
                        <p className="text-xs text-emerald-400 mt-4 animate-pulse">Redirecting to login...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">Loading...</div>}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
