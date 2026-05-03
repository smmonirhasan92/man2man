import { useState } from 'react';
import { Mail, CheckCircle, Smartphone, Lock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function EmailVerificationModal({ user, onVerified }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email'); // 'email', 'otp', 'verified'
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email, context: 'verification' });
            toast.success('OTP sent to your email!');
            setStep('otp');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP.');
            return;
        }

        setLoading(true);
        try {
            // This is the legacy migration endpoint
            await api.post('/auth/verify-legacy-email', { email, otp });
            toast.success('Email verified and linked successfully!');
            setStep('verified');
            setTimeout(() => {
                onVerified(); // Unlocks dashboard
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired OTP.');
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#070b14]/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0b1221] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Top Banner */}
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6 flex flex-col items-center border-b border-white/5">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider text-center">Account Locked</h2>
                    <p className="text-xs text-red-200/80 text-center mt-2 font-medium">Security Update: You must link an email address to continue using USA Affiliate Network.</p>
                </div>

                <div className="p-6">
                    {step === 'email' && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">New Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        className="w-full bg-[#131c31] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all flex justify-center items-center"
                            >
                                {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'Send OTP Code'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in zoom-in-95">
                            <div className="text-center mb-4">
                                <p className="text-sm text-slate-300">OTP sent to: <span className="text-emerald-400 font-bold">{email}</span></p>
                                <button type="button" onClick={() => setStep('email')} className="text-xs text-slate-500 hover:text-white underline mt-1">Change Email</button>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="••••••"
                                    className="w-full bg-[#131c31] border border-white/10 rounded-2xl px-4 py-4 text-center text-white font-mono text-3xl tracking-[0.5em] outline-none focus:border-emerald-500 transition-colors"
                                    autoFocus
                                    required
                                    autoComplete="one-time-code"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
                            >
                                {loading ? <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></span> : 'Verify & Unlock'}
                            </button>
                        </form>
                    )}

                    {step === 'verified' && (
                        <div className="py-6 flex flex-col items-center justify-center animate-in zoom-in-95">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                            <h3 className="text-2xl font-black text-white tracking-widest">VERIFIED!</h3>
                            <p className="text-slate-400 text-sm mt-2">Your dashboard is unlocking...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
