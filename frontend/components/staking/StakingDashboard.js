'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import StakeModal from './StakeModal';
import toast from 'react-hot-toast';

export default function StakingDashboard({ userWallet }) {
    const [hasMounted, setHasMounted] = useState(false);
    const [pools, setPools] = useState([]);
    const [myStakes, setMyStakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPool, setSelectedPool] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        setHasMounted(true);
        fetchData();
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
        if (!confirm("WARNING: You will lose 5% of your principal and ALL rewards. Are you absolutely sure?")) return;

        try {
            setActionLoading(stakeId);
            await api.post(`/staking/withdraw-early/${stakeId}`);
            toast.success("Early Withdrawal Processed (with penalty)");
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to withdraw early');
        } finally {
            setActionLoading(null);
        }
    };

    // --- Helpers (Safe for SSR - they return values, but we guard their usage in JSX) ---
    const getProgress = (stake) => {
        if (!stake.lockedAt || !stake.unlocksAt) return 0;
        const start = new Date(stake.lockedAt).getTime();
        const end = new Date(stake.unlocksAt).getTime();
        const now = Date.now();
        if (now >= end) return 100;
        return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    };

    const getDaysRemaining = (unlocksAt) => {
        if (!unlocksAt) return 0;
        const now = Date.now();
        const end = new Date(unlocksAt).getTime();
        if (now >= end) return 0;
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans animate-in fade-in duration-700">
            {/* Header Stats */}
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

                <div className="flex-1">
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        📈 Micro-Investments
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Lock your NXS for higher returns. Zero effort, steady profits.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-[#0f172a] rounded-xl px-5 py-3 border border-slate-700/50 min-w-[140px]">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Staked</div>
                        <div className="text-xl font-black text-white">{userWallet?.staked?.toFixed(2) || '0.00'} NXS</div>
                    </div>
                    <div className="bg-emerald-500/10 rounded-xl px-5 py-3 border border-emerald-500/20 min-w-[140px]">
                        <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Total Earned</div>
                        <div className="text-xl font-black text-emerald-400">+{userWallet?.total_earned_staking?.toFixed(2) || '0.00'} NXS</div>
                    </div>
                </div>
            </div>

            {/* Investment Pools */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 px-1">📦 Available Pools</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pools.map(pool => (
                        <div key={pool._id} className="bg-[#1e293b] border border-slate-700/50 hover:border-emerald-500/50 transition-all rounded-3xl p-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/5">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${pool.badgeColor || 'bg-white/10 text-white'}`}>
                                    {pool.name}
                                </div>
                                <div className="text-emerald-400 font-black text-2xl tracking-tighter">+{pool.rewardPercentage}%</div>
                            </div>
                            <div className="space-y-3 mb-8 text-sm">
                                <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-slate-500 font-medium">Duration</span>
                                    <span className="font-bold text-slate-200">{pool.durationDays} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-slate-500 font-medium">Min. Lock</span>
                                    <span className="font-bold text-slate-200">{pool.minAmount} NXS</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-white/5">
                                    <span className="text-slate-500 font-medium">Daily Profit</span>
                                    <span className="font-bold text-emerald-500/80">~{(pool.rewardPercentage / pool.durationDays).toFixed(2)}%</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedPool(pool); setIsModalOpen(true); }}
                                className="w-full py-3 rounded-[1.2rem] font-black bg-white/5 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 flex justify-center items-center gap-2 uppercase tracking-widest text-[11px]"
                            >
                                🔒 INVEST NOW
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Active Stakes */}
            <div className="pt-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 px-1">💼 My Portfolio</h2>
                {!myStakes || myStakes.length === 0 ? (
                    <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-[2rem] p-12 text-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <span className="text-3xl">🕳️</span>
                        </div>
                        <h3 className="text-slate-300 font-bold text-lg mt-3">Portfolio Empty</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">No active investments found. Start earning passive income by locking NXS above.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {myStakes.map(stake => {
                            // Date calculations are safe inside map, but we guard their rendering
                            const progress = getProgress(stake);
                            const isMatured = progress >= 100;
                            const daysRemaining = getDaysRemaining(stake.unlocksAt);

                            return (
                                <div key={stake._id} className="bg-[#1e293b] border border-slate-700/50 rounded-[2rem] p-6 shadow-md transition-all hover:border-slate-600 group relative overflow-hidden">
                                     {stake.status === 'ACTIVE' && isMatured && (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
                                     )}
                                    
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        {/* Left: Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-black text-white tracking-tight">{stake.poolId?.name || 'Investment Pool'}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest border ${
                                                    stake.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                    stake.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                                                }`}>
                                                    {stake.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Locked Amount</div>
                                                    <div className="text-white font-black text-lg">{stake.stakedAmount} <span className="text-[10px] text-slate-500">NXS</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Est. Profit</div>
                                                    <div className="text-emerald-400 font-black text-lg">+{stake.expectedReward} <span className="text-[10px] text-emerald-900">NXS</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Locked On</div>
                                                    <div className="text-slate-300 text-sm font-medium">{hasMounted ? new Date(stake.lockedAt).toLocaleDateString() : '...'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 opacity-60">Unlocks On</div>
                                                    <div className="text-slate-200 text-sm font-bold">{hasMounted ? new Date(stake.unlocksAt).toLocaleDateString() : '...'}</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar (Only for ACTIVE) */}
                                            {stake.status === 'ACTIVE' && hasMounted && (
                                                <div className="mt-8">
                                                    <div className="flex justify-between text-[11px] font-black mb-2 uppercase tracking-widest">
                                                        <span className="text-slate-400 flex items-center gap-1.5">
                                                            {isMatured ? '✨ Maturity Reached' : `⏳ ${daysRemaining} Days Remaining`}
                                                        </span>
                                                        <span className={isMatured ? 'text-emerald-400' : 'text-blue-400'}>{progress.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-[#0f172a] rounded-full overflow-hidden border border-white/5 p-0.5">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isMatured ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex flex-row md:flex-col justify-end gap-3 md:w-44 border-t md:border-t-0 md:border-l border-slate-700/40 pt-6 md:pt-0 md:pl-6 shrink-0">
                                            {stake.status === 'ACTIVE' && hasMounted && (
                                                <>
                                                    {isMatured ? (
                                                        <button
                                                            onClick={() => handleClaim(stake._id)}
                                                            disabled={actionLoading === stake._id}
                                                            className="flex-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 flex justify-center items-center gap-2 uppercase tracking-widest text-[11px] transform hover:-translate-y-0.5"
                                                        >
                                                            {actionLoading === stake._id ? <div className="w-4 h-4 rounded-full border-2 border-emerald-200 border-t-transparent animate-spin"></div> : '💎'}
                                                            CLAIM PROFIT
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEarlyWithdraw(stake._id)}
                                                            disabled={actionLoading === stake._id}
                                                            className="flex-1 w-full bg-red-500/5 hover:bg-red-500/10 text-red-500/70 border border-red-500/20 hover:border-red-500/50 font-black py-3.5 rounded-2xl text-[10px] transition-all duration-300 flex justify-center items-center gap-2 uppercase tracking-widest opacity-80"
                                                        >
                                                            {actionLoading === stake._id ? <div className="w-4 h-4 rounded-full border-2 border-red-200 border-t-transparent animate-spin"></div> : '⚠️'}
                                                            EARLY EXIT
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {stake.status === 'COMPLETED' && (
                                                <div className="w-full h-full flex items-center justify-center gap-2 text-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] py-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                                    ✨ SETTLED
                                                </div>
                                            )}
                                            {stake.status === 'CANCELLED' && (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-red-500/30 text-[10px] font-black uppercase tracking-[0.2em] py-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-center">
                                                    <span>⛔ TERMINATED</span>
                                                    <span className="text-[8px] tracking-tight opacity-50 lowercase font-medium">Penalty applied</span>
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

            {/* Modal */}
            <StakeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                pool={selectedPool}
                userBalance={userWallet?.main || 0}
                onConfirm={handleStakeConfirm}
            />
        </div>
    );
}
