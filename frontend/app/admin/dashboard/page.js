'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { ArrowLeft, Users, FileText, Settings, Shield, ShieldCheck, Wallet, Briefcase, MessageSquare, Ticket, Lock, Zap, Activity, Gem, ClipboardList, TrendingUp, AlertTriangle, RefreshCw, BarChart3, Radio } from 'lucide-react';
import DashboardCard from '../../../components/admin/DashboardCard';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        netSystemProfit: 0,
        totalP2PFee: 0,
        total_commission: 0,
        totalServerRevenue: 0,
        totalTaskIncome: 0,
        totalGameBets: 0,
        totalGameWins: 0,
        currentLiabilities: 0,
        totalDeposits: 0,
        totalWithdraws: 0,
        communityDropFund: { total: 0 },
        pendingActions: 0
    });
    const [loading, setLoading] = useState(true);
    const [maintenance, setMaintenance] = useState(false);
    const [updatingMaint, setUpdatingMaint] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const loadData = async () => {
        try {
            const finRes = await api.get('/admin/audit/financial');
            const overview = finRes.data.overview || {};
            const actual = finRes.data.actual || {};
            const eco = finRes.data.economics || {};
            const partnerAudit = finRes.data.partnerAudit || {};

            setStats({
                ...eco,
                totalMinted: overview.total_minted || 0,
                currentLiabilities: actual.total_liability || 0,
                totalDeposits: overview.total_deposits || 0,
                totalWithdraws: overview.total_withdraws || 0,
                pendingActions: (overview.pending_deposits || 0) + (overview.pending_withdraws || 0),
                communityDropFund: partnerAudit.communityDropFund || { total: 0 }
            });

            const sysRes = await api.get('/admin/settings/public');
            if (sysRes.data.maintenance?.isActive) {
                setMaintenance(true);
            }
        } catch (err) {
            console.error("[DASHBOARD_ERROR]", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleMaintenance = async () => {
        setModal({
            isOpen: true,
            title: 'Toggle Maintenance Mode?',
            message: `Are you sure you want to ${maintenance ? 'DISABLE' : 'ENABLE'} Maintenance Mode?`,
            confirmText: maintenance ? 'Disable' : 'Enable',
            onConfirm: async () => {
                setUpdatingMaint(true);
                try {
                    const newState = !maintenance;
                    await api.post('/settings/system', {
                        settings: {
                            maintenance: {
                                isActive: newState,
                                message: newState ? 'System Under Maintenance' : ''
                            }
                        }
                    });
                    setMaintenance(newState);
                    toast.success(`Maintenance Mode ${newState ? 'ENABLED' : 'DISABLED'}`);
                } catch (e) {
                    toast.error('Failed to update maintenance');
                } finally {
                    setUpdatingMaint(false);
                }
            }
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
             <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em]">Authenticating Admin Protocol...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#070b14] font-sans pb-24 text-slate-200 relative overflow-hidden">
            {/* BACKGROUND VFX */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[150px]"></div>
            </div>

            {/* Header Section */}
            <header className="bg-[#0b1221]/80 border-b border-white/5 sticky top-0 z-50 backdrop-blur-2xl">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <Link href="/" className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                                <h1 className="text-xl font-black uppercase tracking-tight text-white">GOD MODE</h1>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded border border-emerald-500/20 uppercase tracking-widest">Master Console</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={loadData}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleMaintenance}
                            disabled={updatingMaint}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${maintenance
                                ? 'bg-rose-500 text-white shadow-rose-500/20 animate-pulse'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {updatingMaint ? (
                                <Activity className="w-3 h-3 animate-spin" />
                            ) : (
                                maintenance ? <Lock className="w-3 h-3" /> : <Radio className="w-3 h-3 text-emerald-400" />
                            )}
                            {maintenance ? 'System Locked' : 'System Live'}
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-[1600px] mx-auto px-6 py-10 relative z-10 space-y-12">
                
                {/* FINANCIAL STATUS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Primary Profit Card */}
                    <div className={`col-span-1 md:col-span-2 xl:col-span-1 bg-[#0b1221]/80 backdrop-blur-xl border p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl ${stats.netSystemProfit >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl opacity-20 ${stats.netSystemProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-2xl ${stats.netSystemProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Net Ecosystem Balance</h3>
                        </div>
                        <div className={`text-4xl font-black tracking-tighter ${stats.netSystemProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stats.netSystemProfit >= 0 ? '+' : ''}{Number(stats.netSystemProfit || 0).toLocaleString()} <span className="text-lg opacity-60">NXS</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 opacity-50">Combined Asset Velocity</p>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Revenue Sources</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">Node Sales</span>
                                <span className="font-black text-white">${Number(stats.totalServerRevenue || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">System Fees</span>
                                <span className="font-black text-white">${Number((stats.totalP2PFee || 0) + (stats.total_commission || 0)).toLocaleString()}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[65%]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-rose-500/30 transition-all">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Liability & Payouts</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">User Wallet Debt</span>
                                <span className="font-black text-white text-rose-400">${Number(stats.currentLiabilities || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">Task Mining</span>
                                <span className="font-black text-white">${Number(stats.totalTaskIncome || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-rose-500 w-[80%]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Total Liquidity</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">Total Inflow</span>
                                <span className="font-black text-emerald-400">${Number(stats.totalDeposits || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">Total Outflow</span>
                                <span className="font-black text-white">${Number(stats.totalWithdraws || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[45%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DROP RESERVOIR BANNER - REIMAGINED */}
                <div className="relative group cursor-pointer" onClick={() => router.push('/admin/financial-control')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-[#0b1221]/60 backdrop-blur-2xl border border-fuchsia-500/30 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"></div>
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-3xl flex items-center justify-center text-fuchsia-400 shadow-2xl animate-pulse">
                                <Zap className="w-10 h-10" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 bg-fuchsia-500 rounded-full"></span>
                                    <h2 className="text-fuchsia-400 text-[10px] font-black uppercase tracking-[0.3em]">Community Drop Reservoir</h2>
                                </div>
                                <p className="text-white text-3xl font-black tracking-tighter uppercase">Big Bang Threshold</p>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Collecting 20% of active node transaction fees</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl flex items-baseline gap-2">
                                {Number(stats.communityDropFund?.total ?? stats.communityDropFund ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                <span className="text-fuchsia-500 text-2xl font-black">NXS</span>
                            </div>
                            <div className={`mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${
                                (stats.communityDropFund?.total ?? stats.communityDropFund ?? 0) >= 100 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-white/5 text-slate-500 border-white/10'
                            }`}>
                                <Activity className="w-3 h-3" />
                                Status: {(stats.communityDropFund?.total ?? stats.communityDropFund ?? 0) >= 100 ? 'UNLOCKED' : 'ACCUMULATING'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <DashboardCard href="/admin/financial-control" title="Financial" description="Traffic & Vault" icon={Activity} colorClass="emerald" />
                    <DashboardCard href="/admin/transactions" title="Transactions" description="Ledger & Actions" icon={FileText} colorClass="blue" badge={stats.pendingActions > 0 ? `${stats.pendingActions}` : ''} />
                    <DashboardCard href="/admin/users" title="Manage Users" description="Identities & Access" icon={Users} colorClass="indigo" />
                    <DashboardCard href="/admin/agents" title="Node Network" description="Affiliate Chains" icon={Briefcase} colorClass="indigo" />
                    <DashboardCard href="/admin/plans" title="Plan Config" description="Tiers & Yields" icon={Gem} colorClass="amber" />
                    <DashboardCard href="/admin/tasks" title="Task Manager" description="Content Protocol" icon={ClipboardList} colorClass="indigo" />
                    <DashboardCard href="/admin/audit" title="Security Audit" description="Integrity Check" icon={Shield} colorClass="rose" />
                    <DashboardCard href="/admin/lottery" title="Lottery Hub" description="Draw Protocols" icon={Ticket} colorClass="fuchsia" />
                    <DashboardCard href="/admin/support" title="Support Desk" description="User Assistance" icon={MessageSquare} colorClass="indigo" />
                    <DashboardCard href="/admin/p2p-tribunal" title="P2P Tribunal" description="Legal Disputes" icon={AlertTriangle} colorClass="rose" />
                    <DashboardCard href="/admin/settings" title="Core Settings" description="Global Variables" icon={Settings} colorClass="gray" />
                </div>

            </main>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText || 'Confirm'}
            />
        </div>
    );
}
