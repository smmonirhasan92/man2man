'use client';
import { useState } from 'react';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // [REFACTOR] Send primary_phone to match Backend
            const payload = { ...formData, primary_phone: formData.phone };
            const res = await api.post('/auth/login', payload);
            const { token, user } = res.data;

            // Store Auth Data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setSuccess('Login Successful! Redirecting...');

            // Redirect based on role
            setTimeout(() => {
                const adminRoles = ['admin', 'super_admin', 'employee_admin'];
                if (adminRoles.includes(user.role)) {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            }, 1000);

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
                            <Smartphone className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="tel"
                            required
                            className="bg-[#0f172a] border border-slate-700/50 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full pl-11 p-3.5 placeholder-slate-600 transition-all font-bold tracking-wide"
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
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            className="bg-[#0f172a] border border-slate-700/50 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full pl-11 p-3.5 placeholder-slate-600 transition-all font-bold tracking-wide"
                            placeholder="••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-4 text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
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
