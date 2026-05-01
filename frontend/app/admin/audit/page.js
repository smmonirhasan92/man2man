'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import getSocket from '../../../services/socket';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Activity, FileText, ArrowLeft, RefreshCw, Layers, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
    const [auditData, setAuditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAuditData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const res = await api.get('/admin/audit/financial');
            setAuditData(res.data);
            setError(null);
        } catch (err) {
            console.error("Audit Fetch Error:", err);
            setError(err.response?.data?.error || err.message || "Unknown Error");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAuditData();

        // REAL-TIME SOCKET SYNC
        const socket = getSocket();
        if (socket) {
            socket.emit('join_admin_room', 'verified_session');
            
            socket.on('vault_update', (data) => {
                setAuditData(prev => {
                    if (!prev) return prev;
                    const updated = { ...prev };
                    
                    if (updated.partnerAudit) {
                        updated.partnerAudit.activePlayerPool = data.redisPot || updated.partnerAudit.activePlayerPool;
                        if (data.dropFunds) {
                            updated.partnerAudit.communityDropFund = {
                                ...updated.partnerAudit.communityDropFund,
                                ...data.dropFunds,
                                total: (data.dropFunds.mega || 0) + (data.dropFunds.boss || 0) + (data.dropFunds.bigbang || 0)
                            };
                        }
                    }
                    return updated;
                });
            });

            return () => {
                socket.off('vault_update');
            };
        }
    }, [fetchAuditData]);

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-[#070b14] text-slate-500 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="font-bold tracking-widest text-[10px] uppercase">Decrypting Ledger...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2.5rem] text-center shadow-2xl shadow-rose-500/10">
                <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-6 animate-bounce" />
                <h3 className="font-black text-2xl text-white mb-2 uppercase tracking-tight">Audit Check Failure</h3>
                <p className="text-rose-400 font-mono text-xs mb-8">{error}</p>
                <button
                    onClick={() => fetchAuditData()}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-rose-500/20"
                >
                    Reconnect to Ledger
                </button>
            </div>
        </div>
    );

    const { authorized = {}, actual = {}, volume = {}, health = {}, economics = {}, partnerAudit = {} } = auditData || {};

    return (
        <div className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans relative overflow-hidden pb-24">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/5 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/dashboard" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Shield className="w-8 h-8 text-indigo-500" />
                                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Security Audit</h1>
                            </div>
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">System Financial Integrity Check</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAuditData}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Re-verify Ledger'}
                    </button>
                </div>

                {/* Health Status Banner */}
                <div className={`p-8 rounded-[2.5rem] border backdrop-blur-2xl transition-all duration-500 shadow-2xl ${
                    health?.status === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/5' :
                    health?.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/5' :
                    'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5'
                }`}>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                        <div className={`p-6 rounded-3xl ${
                            health?.status === 'CRITICAL' ? 'bg-rose-500 text-white' :
                            health?.status === 'WARNING' ? 'bg-amber-500 text-white' :
                            'bg-emerald-500 text-white'
                        } shadow-2xl`}>
                            {health?.status === 'HEALTHY' ? <CheckCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-end gap-2 mb-2">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Ecosystem Health: {health?.status || 'Unknown'}</h2>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 opacity-60">Verified {new Date().toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-400 font-bold text-sm tracking-wide leading-relaxed">{health?.message || 'Awaiting verification signal...'}</p>
                            
                            {(health?.discrepancy || 0) !== 0 && (
                                <div className="mt-6 flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Anomaly Detected</span>
                                    <div className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 font-mono text-sm font-black">
                                        Discrepancy: ${health?.discrepancy?.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Balance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Authorized Inflow */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
                        <h3 className="text-sm font-black text-slate-500 mb-8 flex items-center gap-2 uppercase tracking-widest">
                            <Layers className="w-4 h-4 text-indigo-400" /> Authorized Inflow
                        </h3>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-6 bg-black/40 border border-white/5 rounded-3xl shadow-inner">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Node Deposits</span>
                                <span className="text-xl font-black text-white">${authorized.total_deposits?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-6 bg-black/40 border border-white/5 rounded-3xl shadow-inner">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Net Game Credit Flow</span>
                                <span className={`text-xl font-black ${(authorized.net_game_creation || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {(authorized.net_game_creation || 0) >= 0 ? '+' : ''}${authorized.net_game_creation?.toLocaleString() || '0'}
                                </span>
                            </div>
                            <div className="pt-8 border-t border-white/5 mt-8 flex justify-between items-center px-2">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Authorized Supply</span>
                                <span className="text-3xl font-black text-white tracking-tighter">${authorized.total_supply?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Liability Tracker */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
                        <h3 className="text-sm font-black text-slate-500 mb-8 flex items-center gap-2 uppercase tracking-widest">
                            <DollarSign className="w-4 h-4 text-rose-400" /> Liability Tracker
                        </h3>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-6 bg-black/40 border border-white/5 rounded-3xl shadow-inner">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Main Wallet Balances</span>
                                <span className="text-xl font-black text-white">${actual.user_main_balances?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-6 bg-black/40 border border-white/5 rounded-3xl shadow-inner">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Game Wallet Balances</span>
                                <span className="text-xl font-black text-white">${actual.user_game_balances?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="pt-8 border-t border-white/5 mt-8 flex justify-between items-center px-2">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Current Liability (User Credit)</span>
                                <span className="text-3xl font-black text-rose-500 tracking-tighter">${actual.total_liability?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ecosystem Economics */}
                <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-10 rounded-[3rem] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 opacity-50"></div>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                                <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
                                Economic Sustainability
                            </h2>
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mt-1">Generation (Debt) vs Recovery (Equity)</p>
                        </div>

                        <div className={`px-8 py-5 rounded-3xl flex flex-col items-center gap-1 border ${
                            (economics?.netSystemProfit || 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        } shadow-2xl`}>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Net Economic Balance</span>
                            <span className="text-3xl font-black tracking-tighter">${economics?.netSystemProfit?.toLocaleString() || '0'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Outflow Risk */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-[0.2em] mb-4 ml-1">
                                <TrendingUp className="w-4 h-4 rotate-180" /> Liability Generation
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Task Mining Payouts', val: economics?.totalTaskIncome },
                                    { label: 'Referral & Network Bonus', val: economics?.totalReferralBonus },
                                    { label: 'Lottery Prize Pool', val: economics?.totalLotteryPrizes }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-5 bg-black/30 border border-white/5 rounded-2xl group hover:border-rose-500/20 transition-all">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.label}</span>
                                        <span className="font-black text-white font-mono">${item.val?.toLocaleString() || '0'}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 bg-rose-500/80 text-white rounded-3xl flex justify-between items-center shadow-2xl shadow-rose-500/10">
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Outflow Risk</span>
                                <span className="text-2xl font-black tracking-tighter">${economics?.totalIncomeGiven?.toLocaleString() || '0'}</span>
                            </div>
                        </div>

                        {/* Inflow Recovery */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-[0.2em] mb-4 ml-1">
                                <TrendingUp className="w-4 h-4" /> System Recovery
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Node/Server Sales', val: economics?.totalServerRevenue },
                                    { label: 'Lottery Sales (Burn)', val: economics?.totalLotteryRevenue },
                                    { label: 'P2P Trading Fees', val: economics?.totalP2PFee }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-5 bg-black/30 border border-white/5 rounded-2xl group hover:border-emerald-500/20 transition-all">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.label}</span>
                                        <span className="font-black text-white font-mono">${item.val?.toLocaleString() || '0'}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 bg-emerald-500/80 text-white rounded-3xl flex justify-between items-center shadow-2xl shadow-emerald-500/10">
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Recovery Value</span>
                                <span className="text-2xl font-black tracking-tighter">${economics?.totalSystemRecovery?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Community Drop Reservoir */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-widest ml-2">
                        <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                        Community Drop Reservoir
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: 'Mega Fund', color: 'emerald', val: partnerAudit?.communityDropFund?.mega, desc: 'Bronze/Silver Tier Distribution' },
                            { label: 'Boss Fund', color: 'indigo', val: partnerAudit?.communityDropFund?.boss, desc: 'Gold/Premium Tier Rewards' },
                            { label: 'Big Bang', color: 'rose', val: partnerAudit?.communityDropFund?.bigbang, desc: 'Ultimate Ecosystem Jackpot' }
                        ].map((fund, idx) => (
                            <div key={idx} className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${fund.color}-500/5 rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-125 transition-transform duration-700`}></div>
                                <p className={`text-[10px] font-black text-${fund.color}-500 uppercase tracking-[0.2em] mb-2`}>{fund.label}</p>
                                <h4 className="text-4xl font-black text-white tracking-tighter font-mono">${fund.val?.toLocaleString() || '0'}</h4>
                                <p className="text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest leading-relaxed opacity-60">{fund.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transaction Volume Footer */}
                <div className="bg-gradient-to-br from-[#1a1b2e] to-[#0b1221] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-black/50">
                    <div className="absolute left-0 bottom-0 w-[50%] h-full bg-indigo-600/5 rounded-full blur-[100px]"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ecosystem Velocity</h3>
                            </div>
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase max-w-sm">Cumulative Volume of Peer-to-Peer Node Transfers.</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400 tracking-tighter">${volume.p2p_transfers?.toLocaleString() || '0'}</p>
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Verified P2P Liquidity</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
