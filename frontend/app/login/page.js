'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import { Smartphone, Lock, Eye, EyeOff, UserPlus, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import AuthInput from '@/components/ui/AuthInput';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const savedId = localStorage.getItem('remembered_id');
        if (savedId) setIdentifier(savedId);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const cleanId = identifier.trim();
            const res = await api.post('/auth/login', { identifier: cleanId, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('remembered_id', identifier);
            document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            const adminRoles = ['admin', 'super_admin', 'employee_admin'];
            window.location.href = adminRoles.includes(user.role) ? '/admin/dashboard' : '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0a192f] relative font-sans text-slate-100 overflow-y-auto no-scrollbar">
            {/* [ELITE] High-Tech Background Mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <img 
                    src="/networking_globe.png" 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl opacity-20 object-contain pointer-events-none"
                    alt="Network Background"
                />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 pt-12 pb-12">
                
                {/* [WOW] Minimalist Header */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-150"></div>
                        <img src="/logo.png" className="relative w-24 h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" alt="USA Affiliate" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        Elite <span className="text-red-500">Terminal</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Secure Encryption Active</span>
                    </div>
                </div>

                {/* [ULTRA-CLEAN] Login Card */}
                <div className="w-full max-w-md card-glass p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <h2 className="text-lg font-bold text-slate-200">User Access</h2>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-400 border border-white/10 uppercase tracking-widest">v2.4.0-Live</span>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative">
                            <AuthInput
                                icon={Mail}
                                label="Official Email or Phone"
                                type="text"
                                placeholder="name@example.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="input-premium"
                                required
                            />
                        </div>

                        <div className="relative">
                            <AuthInput
                                icon={Lock}
                                label="Access Password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-premium"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-[42px] text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="flex justify-between items-center text-[11px] px-2">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-300 transition-colors">
                                <input type="checkbox" className="rounded bg-slate-800 border-white/10 text-red-600 focus:ring-0" />
                                <span>Keep Session Active</span>
                            </label>
                            <button type="button" onClick={() => toast.error("Contact admin to reset.")} className="text-red-500/80 hover:text-red-400 font-bold underline underline-offset-4">Reset Access?</button>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" loading={loading} className="w-full btn-secondary h-14 text-sm tracking-[0.2em] font-black group">
                                <span>EXECUTE LOGIN</span>
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </form>
                </div>

                {/* [WOW] Footer Action */}
                <div className="mt-10 flex flex-col items-center gap-4">
                    <p className="text-slate-500 text-xs font-medium">Unauthorized access is strictly prohibited.</p>
                    <Link href="/register" className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <UserPlus className="w-5 h-5 text-red-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">New Member?</span>
                            <span className="text-sm text-white font-black">ENROLL IN NETWORK</span>
                        </div>
                    </Link>
                </div>

            </div>

            {/* Support Floating Button */}
            <button className="fixed bottom-6 right-6 w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl hover:bg-red-500 transition-colors group">
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-white" />
            </button>
        </div>
    );
}
