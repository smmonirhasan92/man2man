'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

// 100% Client-Side Only Import to prevent Hydration Panic (#418)
const StakingDashboard = dynamic(() => import('../../../components/staking/StakingDashboard'), { 
    ssr: false,
    loading: () => (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Initializing Vault...</p>
        </div>
    )
});

export default function InvestPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/me');
            
            // Critical: Ensure user exists and has a wallet object
            if (res.data && res.data.user) {
                const userData = res.data.user;
                if (!userData.wallet) {
                    userData.wallet = { main: 0, staked: 0, total_earned_staking: 0 };
                }
                setUser(userData);
            } else {
                throw new Error("Invalid User Data from Server");
            }
        } catch (e) {
            console.error("Invest Page Auth Error:", e);
            setError(e.response?.data?.message || e.message || "Session Error");
            toast.error("Please login first");
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
                 <div className="w-16 h-16 rounded-3xl bg-[#1e293b] flex items-center justify-center animate-bounce border border-white/5">
                    <span className="text-2xl">⚡</span>
                </div>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] max-w-sm">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-white font-black text-xl mb-2">Secure Load Failed</h2>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition">Retry Connection</button>
                </div>
            </div>
        );
    }

    // Still blank user but no error yet
    if (!user) return <div className="min-h-screen bg-[#020617]"></div>;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 pb-24 overflow-x-hidden">
            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <StakingDashboard userWallet={user.wallet} />
            </div>
        </div>
    );
}
