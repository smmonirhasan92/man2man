'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import StakeModal from './StakeModal';
import toast from 'react-hot-toast';

/**
 * StakingDashboard v3 (Hydration-Proof & Premium)
 * Solves "Black Screen" (Error #418) by moving all time-sensitive 
 * logic into Client-Side Effects only.
 */
export default function StakingDashboard({ userWallet }) {
    const [hasMounted, setHasMounted] = useState(false);
    const [pools, setPools] = useState([]);
    const [myStakes, setMyStakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPool, setSelectedPool] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    
    // Live ticking state for progress bars
    const [now, setNow] = useState(null);

    useEffect(() => {
        setHasMounted(true);
        setNow(Date.now());
        fetchData();
        
        // Tick every 30 seconds for progress updates
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [poolsRes, stakesRes] = await Promise.all([
                api.get('/staking/pools'),
                api.get('/staking/my-stakes')
            ]);
            setPools(poolsRes.data || []);
            setMyStakes(stakesRes.data || []);
        } catch (e) {
            console.error("Fetch Error:", e);
            toast.error(e.response?.data?.message || 'Failed to load staking data');
        } finally {
            setLoading(false);
        }
    };

    const handleStakeConfirm = async (poolId, amount) => {
        try {
            setActionLoading('stake');
            await api.post('/staking/stake', { poolId, amount });
            toast.success("NXS Locked Successfully!");
            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to lock NXS');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClaim = async (stakeId) => {
        try {
            setActionLoading(stakeId);
            await api.post(`/staking/claim/${stakeId}`);
            toast.success("Profit Claimed Successfully!");
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to claim');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEarlyWithdraw = async (stakeId) => {
        if (!confirm("WARNING: You will forfeit a 5% penalty AND any daily profits already paid out to you. Continue?")) return;

        try {
            setActionLoading(stakeId);
            await api.post(`/staking/withdraw-early/${stakeId}`);
            toast.success("Early Withdrawal Processed");
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to withdraw early');
        } finally {
            setActionLoading(null);
        }
    };

    // --- Formatters (Locale Independent) ---
    const formatNXS = (val) => {
        const num = parseFloat(val || 0);
        return num.toFixed(2);
    };

    const formatDate = (dateStr) => {
        if (!dateStr || !hasMounted) return '...';
        try {
            const d = new Date(dateStr);
            // Use hardcoded en-US to avoid hydration mismatch across locales
            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { return 'Invalid Date'; }
    };

    // --- Logic Wrappers (Only run if hasMounted is true) ---
    const getStakeMetrics = (stake) => {
        if (!hasMounted || !now) return { progress: 0, isMatured: false, daysRemaining: 0 };
        
        const start = new Date(stake.lockedAt).getTime();
        const end = new Date(stake.unlocksAt).getTime();
        
        const progress = now >= end ? 100 : Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
        const isMatured = progress >= 100;
        const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
        
        return { progress, isMatured, daysRemaining };
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Initializing Vault...</p>
            </div>
        );
    }

    // Return an early empty state or nothing during hydration to be 100% safe
    if (!hasMounted) return <div className="min-h-screen bg-[#020617]"></div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans pb-10" suppressHydrationWarning={true}>
            {/* Header / Wallet Overview */}
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-[2.5rem] p-7 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8 justify-between items-center relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-60 h-60 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
                        <span className="bg-gradient-to-br from-emerald-400 to-teal-500 bg-clip-text text-transparent">Invest Locker</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-3 font-medium max-w-md">The most secure way to appreciate your NXS assets. High-yield, real-time staking.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl px-6 py-4 border border-white/5 flex-1 min-w-[160px]">
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5 opacity-60 text-center sm:text-left">Staked Balance</div>
                        <div className="text-2xl font-black text-white text-center sm:text-left">{formatNXS(userWallet?.staked)} <span className="text-[10px] opacity-40">NXS</span></div>
                    </div>
                    <div className="bg-emerald-500/5 backdrop-blur-xl rounded-3xl px-6 py-4 border border-emerald-500/10 flex-1 min-w-[160px]">
                        <div className="text-[10px] text-emerald-500/70 font-black uppercase tracking-widest mb-1.5 text-center sm:text-left">Life Earning</div>
                        <div className="text-2xl font-black text-emerald-400 text-center sm:text-left">+{formatNXS(userWallet?.total_earned_staking)} <span className="text-[10px] opacity-40">NXS</span></div>
                    </div>
                </div>
            </div>

            {/* Pools Section */}
            <div className="pt-4">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                        Available Tiers
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {pools.map(pool => (
                        <div key={pool._id} className="bg-[#1e293b]/80 backdrop-blur-md border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500 rounded-[2rem] p-7 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors"></div>

                            <div className="flex justify-between items-start mb-8">
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 ${pool.badgeColor?.includes('emerald') ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {pool.name}
                                </span>
                                <div className="text-emerald-400 font-black text-3xl tracking-tighter">
                                    {pool.rewardPercentage}<span className="text-sm ml-0.5">%</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Duration</span>
                                    <span className="font-black text-slate-200">{pool.durationDays} Days</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Min. Limit</span>
                                    <span className="font-black text-slate-200">{pool.minAmount} NXS</span>
                                </div>
                                <div className="h-px bg-white/5"></div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest">Estimated ROI</span>
                                    <span className="font-black text-emerald-500">~{(pool.rewardPercentage / pool.durationDays).toFixed(2)}% / Day</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setSelectedPool(pool); setIsModalOpen(true); }}
                                className="w-full py-4 rounded-2xl font-black bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all duration-300 uppercase tracking-widest text-[11px]"
                            >
                                Start Staking
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Portfolio */}
            <div className="pt-8">
                <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 px-1">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                    Portfolio
                </h2>
                
                {(!myStakes || myStakes.length === 0) ? (
                    <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-16 text-center border-dashed">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <span className="text-4xl">💼</span>
                        </div>
                        <h3 className="text-slate-400 font-black text-lg uppercase tracking-widest">No Active Positions</h3>
                        <p className="text-slate-600 text-xs mt-2 max-w-xs mx-auto font-medium leading-relaxed">Your active micro-investments will appear here once you lock some NXS.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {myStakes.map(stake => {
                            const { progress, isMatured, daysRemaining } = getStakeMetrics(stake);

                            return (
                                <div key={stake._id} className="bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-6 md:p-8 transition-all hover:bg-[#1e293b] group relative overflow-hidden">
                                    {stake.status === 'ACTIVE' && isMatured && (
                                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse"></div>
                                    )}

                                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-6">
                                                <h3 className="text-xl font-black text-white tracking-tight">{stake.poolId?.name || 'Tier Position'}</h3>
                                                <span className={`px-4 py-1 rounded-full text-[9px] font-black tracking-[0.2em] border ${
                                                    stake.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                    stake.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                    {stake.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 opacity-60">Locked Amount</div>
                                                    <div className="text-white font-black text-lg">{formatNXS(stake.stakedAmount)} <span className="text-[10px] opacity-40">NXS</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-2 opacity-60">Est. Return</div>
                                                    <div className="text-emerald-400 font-black text-lg">+{formatNXS(stake.expectedReward)} <span className="text-[10px] opacity-40">NXS</span></div>
                                                    <div className="text-[9px] text-emerald-500/80 font-bold tracking-widest mt-1">PAID: {formatNXS(stake.accumulatedPaid || 0)} NXS</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 opacity-60">Start Date</div>
                                                    <div className="text-slate-300 text-xs font-bold">{formatDate(stake.lockedAt)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2 opacity-60">Unlock Date</div>
                                                    <div className="text-slate-200 text-xs font-black">{formatDate(stake.unlocksAt)}</div>
                                                </div>
                                            </div>

                                            {stake.status === 'ACTIVE' && (
                                                <div className="mt-10">
                                                    <div className="flex justify-between text-[10px] font-black mb-3 uppercase tracking-[0.2em]">
                                                        <span className={isMatured ? "text-emerald-400" : "text-slate-500"}>
                                                            {isMatured ? '✨ Maturity Reached' : `⏳ ${daysRemaining} Days Remaining`}
                                                        </span>
                                                        <span className={isMatured ? "text-emerald-400" : "text-blue-500 text-xs"}>{progress.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-4 w-full bg-[#0f172a] rounded-full overflow-hidden border border-white/5 p-1 relative">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isMatured ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex lg:flex-col justify-end gap-3 lg:w-48 lg:pl-10 lg:border-l border-white/5 shrink-0 pt-6 lg:pt-0">
                                            {stake.status === 'ACTIVE' && (
                                                <>
                                                    {isMatured ? (
                                                        <button
                                                            onClick={() => handleClaim(stake._id)}
                                                            disabled={actionLoading === stake._id}
                                                            className="flex-1 w-full bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-black py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all duration-300 flex justify-center items-center gap-2 uppercase tracking-widest text-[11px]"
                                                        >
                                                            {actionLoading === stake._id ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : '💎'}
                                                            Claim Reward
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEarlyWithdraw(stake._id)}
                                                            disabled={actionLoading === stake._id}
                                                            className="flex-1 w-full bg-red-500/5 hover:bg-red-500/10 text-red-500/60 border border-red-500/20 hover:border-red-500/40 font-black py-4 rounded-2xl text-[9px] transition-all duration-300 flex justify-center items-center gap-2 uppercase tracking-[0.15em]"
                                                        >
                                                            {actionLoading === stake._id ? <div className="w-4 h-4 rounded-full border-2 border-red-200 border-t-transparent animate-spin"></div> : '⚠️'}
                                                            Prorated Exit
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {stake.status === 'COMPLETED' && (
                                                <div className="w-full h-full min-h-[50px] flex items-center justify-center gap-2 text-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                                    Processed
                                                </div>
                                            )}
                                            {stake.status === 'CANCELLED' && (
                                                <div className="w-full h-full min-h-[50px] flex flex-col items-center justify-center gap-1 text-red-500/30 text-[10px] font-black uppercase tracking-[0.2em] bg-red-500/5 rounded-2xl border border-red-500/10">
                                                    Terminated
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <StakeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                pool={selectedPool}
                userBalance={userWallet?.income || 0}
                onConfirm={handleStakeConfirm}
            />
        </div>
    );
}
