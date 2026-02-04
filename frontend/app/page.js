'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import Link from 'next/link';
import { Smartphone, Lock } from 'lucide-react';
import AuthInput from '../components/ui/AuthInput';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { phone, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'admin' || res.data.user.role === 'super_admin') {
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
        <div className="flex flex-col h-full min-h-screen bg-[#0A2540] relative font-sans text-slate-100 overflow-hidden">
            {/* Background Decoration */}
            {/* American Flag Background (Abstract / Vibe) */}
            {/* Background Decoration - Reference Image */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                    src="/bg-flag.png"
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
                        <AuthInput
                            icon={Smartphone}
                            label="Phone Number"
                            type="tel"
                            placeholder="017..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />

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
