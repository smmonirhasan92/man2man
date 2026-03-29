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
        const fetchUser = async () => {
            try {
                console.log("[Invest] Fetching user auth...");
                const res = await api.get('/auth/me');
                
                // [FIX] The server returns userData directly at res.data
                const userData = res.data;
                
                if (userData && (userData.id || userData._id)) {
                    // Fallback for wallet structure if missing
                    if (!userData.wallet) {
                        userData.wallet = { 
                            main: userData.wallet_balance || 0, 
                            staked: userData.staked || 0, 
                            total_earned_staking: userData.total_earned_staking || 0 
                        };
                    }
                    console.log("[Invest] User authenticated:", userData.id);
                    setUser(userData);
                } else {
                    console.error("[Invest] Invalid Data Structure:", res.data);
                    throw new Error("Invalid User Data Structure");
                }
            } catch (e) {
                console.error("[Invest] Auth Failed:", e);
                setError(e.response?.data?.message || e.message || "Session Error");
                toast.error("Please login first");
                // router.push('/login'); // Temporarily disabled to allow viewing the error screen
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
                 <div className="w-16 h-16 rounded-3xl bg-[#1e293b] flex items-center justify-center animate-bounce border border-white/5">
                    <span className="text-2xl font-bold text-emerald-500">NXS</span>
                </div>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                </div>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">Authenticating...</p>
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
                    <button 
                        onClick={() => window.location.href = '/login'} 
                        className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl active:scale-95 transition shadow-lg shadow-red-600/20"
                    >
                        Return to Login
                    </button>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full py-4 mt-3 bg-white/5 text-slate-400 font-bold text-[11px] uppercase rounded-2xl border border-white/5"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Default Fallback
    if (!user) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                 <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 pb-24 overflow-x-hidden">
            {/* Header section can match your existing dashboard's design token */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <StakingDashboard userWallet={user.wallet} />
            </div>
        </div>
    );
}
