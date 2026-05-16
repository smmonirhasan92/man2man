'use client';
import { useState, useEffect } from 'react';
import { Users, Crown, CheckCircle, Zap, ArrowRight, Inbox } from 'lucide-react';
import ReferralEmpireUI from './ReferralEmpireUI';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useCurrency } from '../../context/CurrencyContext';

export default function ReferralDashboard() {
    const { formatNXS } = useCurrency();

    const [loading, setLoading] = useState(true);
    const [claimingAll, setClaimingAll] = useState(false);
    const [claimingId, setClaimingId] = useState(null);

    const [data, setData] = useState({
        totalReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        lockedCommissions: [],
        stats: {}
    });

    const [networkLevel, setNetworkLevel] = useState(1);
    const [networkData, setNetworkData] = useState([]);
    const [loadingNetwork, setLoadingNetwork] = useState(false);

    useEffect(() => { fetchCoreDashboard(); }, []);
    useEffect(() => { fetchNetwork(networkLevel); }, [networkLevel]);

    const fetchCoreDashboard = async () => {
        setLoading(true);
        try {
            const dashboardRes = await api.get('/referral/dashboard-data');
            setData({
                totalReferrals: dashboardRes.data.stats?.totalReferrals || 0,
                totalEarnings: dashboardRes.data.stats?.totalEarnings || 0,
                pendingEarnings: dashboardRes.data.stats?.pendingReferral || 0,
                lockedCommissions: dashboardRes.data.lockedCommissions || [],
                stats: dashboardRes.data.stats || {}
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNetwork = async (lvl) => {
        setLoadingNetwork(true);
        try {
            const res = await api.get(`/referral/network?level=${lvl}`);
            setNetworkData(res.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingNetwork(false); }
    };

    const handleClaim = async (transactionId) => {
        setClaimingId(transactionId);
        try {
            const res = await api.post('/referral/claim', { transactionId });
            toast.success(`${formatNXS(res.data.amount)} added to Income Wallet!`);
            confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
            fetchCoreDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Claim failed.');
        } finally {
            setClaimingId(null);
        }
    };

    const handleClaimAll = async () => {
        if (data.lockedCommissions.length === 0) return;
        setClaimingAll(true);
        try {
            const res = await api.post('/referral/claim-all');
            toast.success(`${res.data.count} bonuses claimed! Total ${formatNXS(res.data.totalClaimed)} added to Income Wallet.`);
            confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 } });
            fetchCoreDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Claim All failed.');
        } finally {
            setClaimingAll(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-indigo-400 font-bold tracking-widest text-xs uppercase animate-pulse">Building Empire...</p>
        </div>
    );

    const hasPending = data.lockedCommissions.length > 0;

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-700">

            {/* HERO */}
            <div className="bg-[#0b1121] rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl p-6">
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h2 className="text-white font-black text-xl uppercase tracking-widest flex items-center gap-2">
                        <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" /> The Empire
                    </h2>
                    <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {data.totalReferrals} Referrals
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <CheckCircle size={12} /> Income Earned
                        </p>
                        <p className="text-2xl font-black text-white">{formatNXS(data.totalEarnings)}</p>
                    </div>
                    <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Zap size={12} /> Pending Bonus
                        </p>
                        <p className="text-2xl font-black text-amber-400">{formatNXS(data.pendingEarnings)}</p>
                    </div>
                </div>
            </div>

            {/* PENDING COMMISSIONS CLAIM */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h3 className="text-white font-black text-base uppercase tracking-widest">Referral Bonuses</h3>
                        <p className="text-slate-500 text-[10px] font-bold mt-0.5">Claim → Income Wallet → Fund Transfer → Main Wallet</p>
                    </div>
                    {hasPending && (
                        <button
                            onClick={handleClaimAll}
                            disabled={claimingAll}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        >
                            {claimingAll
                                ? <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                                : <Zap size={12} className="fill-black" />
                            }
                            Claim All ({data.lockedCommissions.length})
                        </button>
                    )}
                </div>

                {!hasPending ? (
                    <div className="text-center py-12 bg-[#0f172a] rounded-[2rem] border border-white/5 border-dashed">
                        <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-black uppercase tracking-widest">No Pending Bonuses</p>
                        <p className="text-slate-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Your bonuses will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.lockedCommissions.map((trx) => (
                            <div key={trx._id} className="bg-[#0f172a] p-4 rounded-2xl border border-amber-500/10 flex items-center justify-between shadow-lg hover:border-amber-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm">{formatNXS(trx.amount)}</p>
                                        <p className="text-slate-500 text-[10px] font-bold truncate max-w-[180px]">
                                            {trx.description || 'Referral Commission'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleClaim(trx._id)}
                                    disabled={claimingId === trx._id}
                                    className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black font-black text-[10px] px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 border border-amber-500/30"
                                >
                                    {claimingId === trx._id
                                        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        : <><span>Claim</span><ArrowRight size={10} /></>
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3-TIER EMPIRE */}
            <ReferralEmpireUI stats={data.stats} />

            {/* TEAM NETWORK */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg"><Users className="w-5 h-5 text-indigo-400" /></div>
                    <h2 className="text-white font-black text-lg uppercase tracking-widest">Team Network</h2>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                        <button key={lvl} onClick={() => setNetworkLevel(lvl)}
                            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all shrink-0 shadow-lg ${networkLevel === lvl ? 'bg-indigo-600 text-white border-b-4 border-indigo-800 scale-105' : 'bg-[#0f172a] text-slate-400 hover:text-white border border-white/5'}`}>
                            Level {lvl}
                        </button>
                    ))}
                </div>
                <div className="space-y-3">
                    {loadingNetwork ? (
                        <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : networkData.length > 0 ? (
                        networkData.map(member => (
                            <div key={member._id} className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-xl relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${member.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-rose-500'}`}></div>
                                <div className="flex items-center gap-4 pl-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center text-white font-black text-lg">
                                        {member.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{member.fullName || member.username}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-slate-400 font-mono bg-black/50 px-2 py-0.5 rounded uppercase">@{member.username}</span>
                                            <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${member.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                                {member.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right bg-white/5 p-2 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Generated</p>
                                    <span className="text-amber-400 text-sm font-black">{formatNXS(member.commission || 0)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-[#0f172a] rounded-[2rem] border border-white/5 border-dashed shadow-inner">
                            <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-300 text-sm font-black uppercase tracking-widest">No Network Found</p>
                            <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase">No referrals at Level {networkLevel}</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
