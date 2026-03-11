'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import StakeModal from './StakeModal';
import toast from 'react-hot-toast';

export default function StakingDashboard({ userWallet }) {
    const [pools, setPools] = useState([]);
    const [myStakes, setMyStakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPool, setSelectedPool] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [poolsRes, stakesRes] = await Promise.all([
                api.get('/staking/pools'),
                api.get('/staking/my-stakes')
            ]);
            setPools(poolsRes.data);
            setMyStakes(stakesRes.data);
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

    // --- Helpers ---
    const getProgress = (stake) => {
        const start = new Date(stake.lockedAt).getTime();
        const end = new Date(stake.unlocksAt).getTime();
        const now = Date.now();
        if (now >= end) return 100;
        return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    };

    const getDaysRemaining = (unlocksAt) => {
        const now = Date.now();
        const end = new Date(unlocksAt).getTime();
        if (now >= end) return 0;
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div></div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto font-sans">
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
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📦 Available Pools</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pools.map(pool => (
                        <div key={pool._id} className="bg-[#1e293b] border border-slate-700/50 hover:border-emerald-500/50 transition-colors rounded-2xl p-5 relative overflow-hidden group">
                            {/* Decorative gradient line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${pool.badgeColor}`}>
                                    {pool.name}
                                </div>
                                <div className="text-emerald-400 font-black text-xl">+{pool.rewardPercentage}%</div>
                            </div>
                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex justify-between text-slate-300">
                                    <span className="text-slate-500">Duration</span>
                                    <span className="font-bold">{pool.durationDays} Days</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span className="text-slate-500">Min. Lock</span>
                                    <span className="font-bold">{pool.minAmount} NXS</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedPool(pool); setIsModalOpen(true); }}
                                className="w-full py-2.5 rounded-xl font-bold bg-[#0f172a] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition flex justify-center items-center gap-2"
                            >
                                🔒 INVEST NOW
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* My Active Stakes */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">💼 My Portfolio</h2>
                {myStakes.length === 0 ? (
                    <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-10 text-center">
                        <h3 className="text-slate-300 font-bold text-lg mt-3">No Active Investments</h3>
                        <p className="text-slate-500 text-sm mt-1">Lock some NXS in the pools above to start earning passive income.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myStakes.map(stake => {
                            const progress = getProgress(stake);
                            const isMatured = progress >= 100;
                            const daysRemaining = getDaysRemaining(stake.unlocksAt);

                            return (
                                <div key={stake._id} className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5 md:p-6 shadow-md transition hover:border-slate-600">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">

                                        {/* Left: Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">{stake.poolId?.name || 'Legacy Pool'}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${stake.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : stake.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                                    }`}>
                                                    {stake.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black">Locked</div>
                                                    <div className="text-white font-mono">{stake.stakedAmount} NXS</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-emerald-500 uppercase font-black">Expected Profit</div>
                                                    <div className="text-emerald-400 font-mono">+{stake.expectedReward} NXS</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black">Start Date</div>
                                                    <div className="text-slate-300 text-xs mt-1">{new Date(stake.lockedAt).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-black">Unlock Date</div>
                                                    <div className="text-slate-300 text-xs mt-1">{new Date(stake.unlocksAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar (Only for ACTIVE) */}
                                            {stake.status === 'ACTIVE' && (
                                                <div className="mt-5">
                                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                                        <span className="text-slate-400 flex items-center gap-1">
                                                            ⏱️ {isMatured ? 'Matured!' : `${daysRemaining} Days Left`}
                                                        </span>
                                                        <span className="text-emerald-400">{progress.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-[#0f172a] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${isMatured ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex md:flex-col justify-end gap-2 md:w-40 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-4">
                                            {stake.status === 'ACTIVE' && (
                                                <>
                                                    {isMatured ? (
                                                        <button
                                                            onClick={() => handleClaim(stake._id)}
                                                            disabled={actionLoading === stake._id}
                                                            className="flex-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 transition flex justify-center items-center gap-2"
                                                        >
                                                            {actionLoading === stake._id ? <div className="w-4 h-4 rounded-full border-2 border-emerald-200 border-t-transparent animate-spin"></div> : '✅'}
                                                            CLAIM
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEarlyWithdraw(stake._id)}
                                                            disabled={actionLoading === stake._id}
                                                            className="flex-1 w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 hover:border-red-500/50 font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-1"
                                                        >
                                                            {actionLoading === stake._id ? <div className="w-4 h-4 rounded-full border-2 border-red-200 border-t-transparent animate-spin"></div> : '⚠️'}
                                                            Early Withdraw
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {stake.status === 'COMPLETED' && (
                                                <div className="w-full flex items-center justify-center gap-1 text-emerald-500/50 text-xs font-bold font-mono py-2">
                                                    ✅ SETTLED
                                                </div>
                                            )}
                                            {stake.status === 'CANCELLED' && (
                                                <div className="w-full flex items-center justify-center gap-1 text-red-500/50 text-xs font-bold font-mono py-2 flex-col text-center">
                                                    <div className="flex items-center justify-center gap-1">❌ CANCELLED</div>
                                                    <span className="text-[10px] font-normal leading-tight opacity-70">Penalty Applied</span>
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
