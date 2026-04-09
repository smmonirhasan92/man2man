'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import getSocket from '../../../services/socket';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
    const [auditData, setAuditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAuditData = useCallback(async () => {
        try {
            const res = await api.get('/admin/audit/financial');
            setAuditData(res.data);
        } catch (err) {
            console.error("Audit Fetch Error:", err);
            setError(err.response?.data?.error || err.message || "Unknown Error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAuditData();

        // [NEW] REAL-TIME SOCKET SYNC
        const socket = getSocket();
        if (socket) {
            socket.emit('join_admin_room', 'verified_session');
            
            // Listen for global point updates
            socket.on('vault_update', (data) => {
                setAuditData(prev => {
                    if (!prev) return prev;
                    
                    const updated = { ...prev };
                    
                    // Update partnerAudit stats specifically
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
                    
                    // Update main balances if available in vault_update
                    if (data.balances && updated.actual) {
                        // Assuming frontend actual cards might need updating too
                        // updated.actual.total_liability = ...
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
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-6 border border-red-200">
            <h3 className="font-bold text-lg mb-2">Audit Check Failed</h3>
            <p className="font-mono text-sm">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 font-bold hover:bg-red-50"
            >
                Retry
            </button>
        </div>
    );

    if (!auditData) return (
        <div className="p-8 text-center text-slate-500">No data available.</div>
    );

    const { authorized = {}, actual = {}, volume = {}, health = {} } = auditData || {};

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-8 h-8 text-slate-700" />
                        System Financial Audit
                    </h1>
                    <p className="text-slate-500">Real-time integrity check of system funds.</p>
                </div>
                <button
                    onClick={fetchAuditData}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                >
                    <Activity className="w-5 h-5" />
                </button>
            </div>

            {/* Health Status Banner */}
            {/* Health Status Banner */}
            <div className={`p-6 rounded-3xl border ${health?.status === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-800' :
                health?.status === 'WARNING' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${health?.status === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                        health?.status === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                        {health?.status === 'HEALTHY' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-1">System Status: {health?.status || 'Unknown'}</h2>
                        <p className="font-medium opacity-90">{health?.message || 'No status available'}</p>
                        {(health?.discrepancy || 0) !== 0 && (
                            <p className="text-sm mt-2 font-mono bg-white/50 inline-block px-3 py-1 rounded-lg">
                                Discrepancy Amount: ${health?.discrepancy}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Authorized Money (Inflow) */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        Authorized Inflow
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 text-sm font-medium">Total Deposits</span>
                            <span className="text-lg font-bold text-slate-700">${authorized.total_deposits?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 text-sm font-medium">Net Game Money Created</span>
                            <span className={`text-lg font-bold ${(authorized.net_game_creation || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {(authorized.net_game_creation || 0) >= 0 ? '+' : ''}${authorized.net_game_creation?.toLocaleString() || '0'}
                            </span>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Authorized</span>
                            <span className="text-2xl font-black text-indigo-600">${authorized.total_supply?.toLocaleString() || '0'}</span>
                        </div>
                    </div>
                </div>

                {/* Actual Liability (Outflow/Holdings) */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-pink-500" />
                        Current User Holdings
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 text-sm font-medium">Main Wallet Balances</span>
                            <span className="text-lg font-bold text-slate-700">${actual.user_main_balances?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-slate-500 text-sm font-medium">Game Wallet Balances</span>
                            <span className="text-lg font-bold text-slate-700">${actual.user_game_balances?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Liability</span>
                            <span className="text-2xl font-black text-pink-600">${actual.total_liability?.toLocaleString() || '0'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* [NEW] ECOSYSTEM MONEY FLOW SECTION */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-sky-500" />
                            Ecosystem Money Flow
                        </h2>
                        <p className="text-slate-500 text-sm">How much money is being generated (Liability) vs recovered (Equity).</p>
                    </div>

                    {/* Sustainability Badge */}
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${(auditData.economics?.netSystemProfit || 0) >= 0
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                        <span className="text-xs font-bold uppercase tracking-wider">Net Sustainability</span>
                        <span className="text-lg font-black">${auditData.economics?.netSystemProfit?.toLocaleString() || '0'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Column 1: Liability Generation (Mining/Referrals) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest px-2">
                            <TrendingUp className="w-4 h-4 rotate-180" /> Liability Generation (Outflow Risk)
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-4 bg-rose-50/50 border border-rose-100/50 rounded-2xl">
                                <span className="text-slate-600 text-sm font-medium">Task Mining (Mined by Users)</span>
                                <span className="font-bold text-slate-800">${auditData.economics?.totalTaskIncome?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-rose-50/50 border border-rose-100/50 rounded-2xl">
                                <span className="text-slate-600 text-sm font-medium">Referral Generation (Bonus)</span>
                                <span className="font-bold text-slate-800">${auditData.economics?.totalReferralBonus?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-rose-50/50 border border-rose-100/50 rounded-2xl">
                                <span className="text-slate-600 text-sm font-medium">Lottery Wins (Prizes Given)</span>
                                <span className="font-bold text-slate-800">${auditData.economics?.totalLotteryPrizes?.toLocaleString() || '0'}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-rose-500 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-rose-500/10">
                            <span className="text-xs font-bold uppercase">Total Generation</span>
                            <span className="text-xl font-black">${auditData.economics?.totalIncomeGiven?.toLocaleString() || '0'}</span>
                        </div>
                    </div>

                    {/* Column 2: Recovery (Sales/Fees) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest px-2">
                            <TrendingUp className="w-4 h-4" /> System Recovery (Equity Building)
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
                                <span className="text-slate-600 text-sm font-medium">Server Sales (NXS Recovery)</span>
                                <span className="font-bold text-slate-800">${auditData.economics?.totalServerRevenue?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
                                <span className="text-slate-600 text-sm font-medium">Lottery Sales (Liability Burn)</span>
                                <span className="font-bold text-slate-800">${auditData.economics?.totalLotteryRevenue?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl">
                                <span className="text-slate-600 text-sm font-medium">P2P Fees Collected</span>
                                <span className="font-bold text-slate-800">${auditData.economics?.totalP2PFee?.toLocaleString() || '0'}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-500 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-emerald-500/10">
                            <span className="text-xs font-bold uppercase">Total Recovery</span>
                            <span className="text-xl font-black">${auditData.economics?.totalSystemRecovery?.toLocaleString() || '0'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* [NEW] REAL-TIME COMMUNITY DROP POOLS */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-500" />
                            Community Drop Pools
                        </h2>
                        <p className="text-slate-500 text-sm">Real-time allocation of player fees into surprise jackpots.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mega Win Fund */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Mega Win Fund</p>
                        <h4 className="text-3xl font-black text-slate-800">${auditData.partnerAudit?.communityDropFund?.mega?.toLocaleString() || '0'}</h4>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Small-tier surprise wins (Bronze/Silver)</p>
                    </div>

                    {/* Boss Win Fund */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Boss Win Fund</p>
                        <h4 className="text-3xl font-black text-slate-800">${auditData.partnerAudit?.communityDropFund?.boss?.toLocaleString() || '0'}</h4>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">High-tier priority rewards (Gold 9+ NXS)</p>
                    </div>

                    {/* Big Bang Fund */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Big Bang Fund</p>
                        <h4 className="text-3xl font-black text-slate-800">${auditData.partnerAudit?.communityDropFund?.bigbang?.toLocaleString() || '0'}</h4>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Ultimate community jackpot (Everyone)</p>
                    </div>
                </div>
            </div>

            {/* Circulation Volume */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                            Circulation Volume
                        </h3>
                        <p className="text-slate-400 text-sm max-w-sm">Total value of money moving through the system (P2P Transfers).</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black text-emerald-400 tracking-tight">${volume.p2p_transfers?.toLocaleString() || '0'}</p>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Total Transferred</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
