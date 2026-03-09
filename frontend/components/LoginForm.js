'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api'; // Use the configured API instance
import { Lock, Smartphone, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Load saved phone number on mount
    useEffect(() => {
        const savedPhone = localStorage.getItem('savedPhone');
        if (savedPhone) {
            setFormData(prev => ({ ...prev, phone: savedPhone }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // [PROACTIVE CLEANUP] Clear OLD session before starting new login
        // This prevents "stuck" states or stale headers when switching accounts
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('active_server_id');
            localStorage.removeItem('active_server_phone');
            document.cookie = 'token=; path=/; max-age=0';
        } catch (e) {
            console.error('Cleanup failed:', e);
        }

        try {
            // [REFACTOR] Send primary_phone to match Backend
            // [FIX] Sanitize inputs to remove hidden trailing spaces from mobile keyboards
            const cleanPhone = formData.phone.trim();
            const cleanPassword = formData.password.trim();

            const payload = {
                phone: cleanPhone,
                password: cleanPassword,
                primary_phone: cleanPhone
            };
            const res = await api.post('/auth/login', payload);
            const { token, user } = res.data;

            // Store Auth Data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            // Remember phone for next login
            localStorage.setItem('savedPhone', cleanPhone);
            // [FIX] Also store in cookie so Next.js middleware can protect routes server-side
            document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            setSuccess('Login Successful! Redirecting...');

            // Redirect based on role (Hard Redirect for cookie sync)
            const adminRoles = ['admin', 'super_admin', 'employee_admin'];
            const target = adminRoles.includes(user.role) ? '/admin/dashboard' : '/dashboard';

            // Hard refresh redirect ensures middleware picks up cookie instantly
            window.location.href = target;

        } catch (err) {
            console.error('Login Error Full Response:', err);
            const msg = err.response?.data?.message || err.message || 'Login Failed. Check connection.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-green-400 text-sm font-bold">{success}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Smartphone className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                            type="tel"
                            required
                            className="bg-[#131c31] border border-white/5 text-white text-sm rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 block w-full pl-11 p-4 placeholder-slate-500 transition-all font-bold tracking-wide"
                            placeholder="01xxxxxxxxx"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            className="bg-[#131c31] border border-white/5 text-white text-sm rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 block w-full pl-11 p-4 placeholder-slate-500 transition-all font-bold tracking-wide"
                            placeholder="••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 focus:ring-4 focus:ring-emerald-500/30 font-bold rounded-2xl text-sm px-5 py-4 text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group mt-4 hover:shadow-emerald-500/30"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Signing In...</span>
                        </>
                    ) : (
                        <>
                            <span>Login Securely</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
