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
            playError();
            return;
        }
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(code);
        setVerificationStep('verifying');
        playNotification();
        setNotification({ type: 'info', message: `Your Code: ${code}` });
        setTimeout(() => setNotification(null), 10000);
    };

    const handleVerifyOtp = () => {
        if (userOtp === generatedOtp) {
            setVerificationStep('verified');
            playSuccess();
            setNotification({ type: 'success', message: 'Verified!' });
            setTimeout(() => setNotification(null), 3000);
        } else {
            setError('Incorrect Code. Check notification.');
            playError();
        }
    };

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
                playSuccess();
                router.push(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
            } else { router.push('/'); }
        } catch (err) {
            // [MOBILE DEBUGGING] - FORCE ALERT TO SEE RAW ERROR


            setError(err.response?.data?.message || 'Registration failed');
            playError();
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0A2540] relative font-sans text-slate-100 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img src="/bg-flag.png" alt="USA Flag" className="absolute inset-0 w-full h-full object-cover opacity-100" />
                <div className="absolute inset-0 bg-[#0A2540]/30 mix-blend-multiply"></div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top duration-500 flex items-center gap-4 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-white text-[#0A2540]'}`}>
                    <Smartphone className="w-5 h-5" />
                    <span className="font-mono text-xl font-black tracking-widest">{notification.message}</span>
                </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-8">
                <Link href="/" className="absolute top-8 left-8 text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back</Link>

                <div className="card-glass w-full max-w-lg p-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-secondary)]"></div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white drop-shadow-xl uppercase tracking-tighter">
                            Create <span className="text-red-500">Citizen</span> ID
                        </h1>
                        <p className="text-blue-200 text-xs font-bold tracking-widest mt-1 uppercase">Unified Access System</p>
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
                                <div className="relative w-[35%]">
                                    <button type="button" onClick={() => setShowCountryList(!showCountryList)} className="input-premium pl-4 pr-2 flex items-center justify-between gap-1 hover:bg-white/10 cursor-pointer">
                                        <img
                                            src={`https://flagcdn.com/w40/${countries.find(c => c.code === formData.countryCode)?.flagCode || 'bd'}.png`}
                                            alt="flag"
                                            className="w-6 h-4 rounded shadow-sm object-cover"
                                        />
                                        <span className="text-sm font-bold text-slate-200">{formData.countryCode}</span>
                                    </button>

                                    {showCountryList && (
                                        <div className="absolute z-50 top-full mt-2 w-64 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95">
                                            {countries.map(c => (
                                                <div key={c.name} onClick={() => { setFormData({ ...formData, countryCode: c.code }); setShowCountryList(false); }} className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                                                    <img src={`https://flagcdn.com/w40/${c.flagCode}.png`} alt={c.name} className="w-8 h-5 rounded shadow-sm" />
                                                    <div><p className="text-sm font-bold text-white">{c.name}</p><p className="text-xs text-slate-400">{c.code}</p></div>
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
                        <div className="bg-black/20 rounded-2xl p-4 border border-white/10 mt-4">
                            {verificationStep === 'initial' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Human Verification Required</span>
                                    <button type="button" onClick={handleSendOtp} className="px-4 py-2 bg-[var(--brand-secondary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition shadow-lg">
                                        GET CODE
                                    </button>
                                </div>
                            )}

                            {verificationStep === 'verifying' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>Enter Code from Popup</span>
                                        <span className="text-[var(--brand-secondary)] animate-pulse font-bold">Waiting...</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={userOtp}
                                            onChange={(e) => setUserOtp(e.target.value)}
                                            placeholder="XXXX"
                                            className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-center text-white font-mono text-lg tracking-[0.5em] outline-none focus:border-[var(--brand-secondary)] transition-colors"
                                            autoFocus
                                        />
                                        <button type="button" onClick={handleVerifyOtp} className="px-5 py-2 bg-white text-[#0A2540] text-sm font-bold rounded-lg hover:bg-slate-200 transition">
                                            OK
                                        </button>
                                    </div>
                                </div>
                            )}

                            {verificationStep === 'verified' && (
                                <div className="flex items-center justify-center gap-2 text-green-400 font-bold py-2 anim-pop">
                                    <CheckCircle className="w-6 h-6" /> VERIFIED
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || verificationStep !== 'verified'}
                            className={`w-full py-4 rounded-full font-bold text-lg shadow-xl transition-all ${verificationStep === 'verified' ? 'bg-gradient-to-r from-[var(--brand-primary)] to-[#0f172a] text-white hover:scale-[1.02]' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                        >
                            {loading ? 'Creating...' : 'Finalize Registration'}
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
