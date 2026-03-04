'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import Link from 'next/link';
import { Smartphone, Lock, ChevronDown } from 'lucide-react';
import AuthInput from '../components/ui/AuthInput';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

// Premium Country Data with CDN Flag Images (Same as Register)
const countries = [
    { name: 'Bangladesh', code: '+880', flagCode: 'bd' },
    { name: 'India', code: '+91', flagCode: 'in' },
    { name: 'Pakistan', code: '+92', flagCode: 'pk' },
    { name: 'United States', code: '+1', flagCode: 'us' },
    { name: 'United Kingdom', code: '+44', flagCode: 'gb' },
    { name: 'Canada', code: '+1', flagCode: 'ca' },
    { name: 'UAE', code: '+971', flagCode: 'ae' }
];

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+880');
    const [showCountryList, setShowCountryList] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // [NEW] Format Phone Payload to include country code (stripped of leading zeros)
            const formattedPhone = `${countryCode}${phone.replace(/^0+/, '')}`;

            const res = await api.post('/auth/login', { phone: formattedPhone, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            const adminRoles = ['admin', 'super_admin', 'employee_admin'];

            if (adminRoles.includes(res.data.user.role)) {
                router.push('/admin/dashboard');
            } else if (res.data.user.role === 'agent') {
                router.push('/agent/dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0A2540] relative font-sans text-slate-100 overflow-y-auto custom-scrollbar">
            {/* Background Decoration */}
            {/* American Flag Background (Abstract / Vibe) */}
            {/* Background Decoration - Reference Image */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1080"
                    alt="USA Flag Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-100"
                />
                {/* Overlay to ensure text readability */}
                <div className="absolute inset-0 bg-[#0A2540]/30 mix-blend-multiply"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 pt-12 pb-6">

                {/* Logo Section */}
                <div className="mb-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#0A2540] to-[#EF4444] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img src="/logo.png" className="relative w-28 h-28 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" alt="USA Afiliat" />
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight mt-6 text-transparent bg-clip-text bg-gradient-to-r from-[#0A2540] to-[#EF4444]">
                        USA Afiliat
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-semibold tracking-wide flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Premium Secure Earnings
                    </p>
                </div>

                {/* Glass Login Card with Flag Theme Borders */}
                <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(10,37,64,0.5)] animate-in slide-in-from-bottom-5 duration-700 relative overflow-hidden">

                    {/* Top Red Line for "Flag" accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#EF4444]"></div>

                    <h2 className="text-2xl font-black mb-8 text-center text-white drop-shadow-md">Welcome Back</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center border border-red-100 shadow-sm">
                            <span className="bg-red-100 p-1 rounded-full mr-2">🚫</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300 ml-1">Phone Number</label>
                            <div className="flex gap-2">
                                <div className="relative w-[35%]">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountryList(!showCountryList)}
                                        className="w-full h-[52px] bg-black/40 border border-white/20 rounded-xl px-4 text-white font-medium flex items-center justify-between gap-2 hover:bg-black/60 hover:border-white/40 focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-all outline-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://flagcdn.com/w40/${countries.find(c => c.code === countryCode)?.flagCode || 'bd'}.png`}
                                                alt="flag"
                                                className="w-6 h-4 rounded-sm object-cover shadow-sm"
                                            />
                                            <span className="text-sm font-bold tracking-wide">{countryCode}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCountryList ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showCountryList && (
                                        <div className="absolute z-[100] top-[calc(100%+8px)] left-0 w-64 bg-[#0A2540] border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {countries.map(c => (
                                                    <div
                                                        key={c.name}
                                                        onClick={() => {
                                                            setCountryCode(c.code);
                                                            setShowCountryList(false);
                                                        }}
                                                        className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                                                    >
                                                        <img src={`https://flagcdn.com/w40/${c.flagCode}.png`} alt={c.name} className="w-6 h-4 rounded-sm shadow-sm object-cover" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-white">{c.name}</p>
                                                        </div>
                                                        <p className="text-xs font-mono font-medium text-slate-400">{c.code}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="w-full h-[52px] bg-black/40 border border-white/20 rounded-xl pl-11 pr-4 text-white placeholder-slate-500 font-medium hover:bg-black/60 hover:border-white/40 focus:bg-black/60 focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <AuthInput
                            icon={Lock}
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="pt-4">
                            <Button
                                type="submit"
                                loading={loading}
                                className="w-full text-base py-4 placeholder-opacity-50"
                            >
                                LOGIN
                            </Button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => toast("Please contact Customer Support.", { icon: 'ℹ️' })}
                                className="text-slate-400 text-xs hover:text-[#0056D2] transition font-medium underline underline-offset-4"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-10 text-center text-sm font-medium">
                    <span className="text-slate-500">Don't have an account?</span>{' '}
                    <Link href="/register" className="text-[#EF4444] font-bold hover:text-red-700 transition inline-flex items-center gap-1 group">
                        Create Account <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

            </div>
        </div>
    );
}
