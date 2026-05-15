'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { ArrowLeft, Users, FileText, Settings, Shield, ShieldCheck, Wallet, Briefcase, MessageSquare, Ticket, Lock, Zap, Activity, Gem, ClipboardList, TrendingUp, AlertTriangle, RefreshCw, BarChart3, Radio, Server, Camera, ExternalLink } from 'lucide-react';
import DashboardCard from '../../../components/admin/DashboardCard';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import toast from 'react-hot-toast';
import { formatNXS, formatUSD } from '../../../utils/currency';

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
        pendingActions: 0,
        adminReserveFund: 0
    });
    const [recentSupport, setRecentSupport] = useState([]);
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
            const agentLive = finRes.data.agent_live_stats || {};

            setStats({
                ...eco,
                totalMinted: overview.total_minted || 0,
                currentLiabilities: actual.total_liability || 0,
                totalDeposits: eco.totalDeposits || overview.today_deposits || 0,
                totalWithdraws: eco.totalWithdraws || overview.today_withdraws || 0,
                pendingActions: (overview.pending_deposits || 0) + (overview.pending_withdraws || 0),
                communityDropFund: partnerAudit.communityDropFund || { total: 0 },
                adminReserveFund: eco.adminReserveFund || 0,
                agentLive: agentLive
            });

            // [NEW] Fetch Recent Support for Feedback Feed
            try {
                const supportRes = await api.get('/support/all');
                setRecentSupport(supportRes.data.slice(0, 5));
            } catch (e) { console.error("Support fetch failed", e); }

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
                
                {/* FINANCIAL STATUS GRID (ACCOUNTING MASTER VIEW) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                    {/* 1. ADMIN MASTER FUND */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-indigo-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Admin Created Money
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Minted by Admin</p>
                                <p className="text-2xl font-black text-white">{formatNXS(stats.totalMinted || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Users Balance (Liability)</p>
                                <p className="text-xl font-black text-rose-400">{formatNXS(stats.currentLiabilities || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Net System Balance</p>
                                <p className={`text-lg font-black ${(stats.totalMinted - stats.currentLiabilities) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {formatNXS((stats.totalMinted || 0) - (stats.currentLiabilities || 0))}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. SYSTEM CASH FLOW */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> User Cash Flow
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Deposited by Users</p>
                                <p className="text-2xl font-black text-emerald-400">{formatNXS(stats.totalDeposits || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Withdrawn by Users</p>
                                <p className="text-xl font-black text-slate-300">{formatNXS(stats.totalWithdraws || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center bg-emerald-500/5 p-2 rounded-lg">
                                <p className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest">Today's Total Volume</p>
                                <p className="text-sm font-black text-emerald-400">
                                    {formatNXS(
                                        (stats.agentLive?.cash_in_today || 0) + 
                                        (stats.agentLive?.p2p_volume_today || 0) + 
                                        (stats.agentLive?.package_sales_today || 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. LIABILITY GENERATION */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-rose-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 rotate-180" /> System Expenses
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Task & Ad Income Paid</p>
                                <p className="text-2xl font-black text-rose-400">{formatNXS(stats.totalTaskIncome || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Referral Bonus Paid</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS(stats.totalReferralBonus || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Game & Lottery Paid</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS((stats.totalGameWins || 0) + (stats.totalLotteryPrizes || 0))}</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. SYSTEM REVENUE */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-amber-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> System Income
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Packages Sold</p>
                                <p className="text-2xl font-black text-amber-400">{formatNXS(stats.totalServerRevenue || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">P2P Transfer Fees</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS(stats.totalP2PFee || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Game & Lottery Earnings</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS((stats.totalGameBets || 0) + (stats.totalLotteryRevenue || 0))}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* [NEW] LIVE FEEDBACK & SCREENSHOT FEED */}
                <div className="bg-[#0b1221]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-indigo-400" /> Live Feedback Feed
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">Real-time user support requests and screenshots</p>
                        </div>
                        <Link href="/admin/support" className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2">
                            View All Support <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {recentSupport.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500 text-xs uppercase tracking-widest font-black opacity-30">
                                No recent feedback detected
                            </div>
                        ) : (
                            recentSupport.map((ticket, idx) => {
                                const lastMsg = ticket.messages?.[ticket.messages.length - 1];
                                const hasImage = ticket.messages?.some(m => m.image);
                                return (
                                    <Link key={idx} href="/admin/support" className="group bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all flex flex-col gap-3 relative">
                                        <div className="flex justify-between items-start">
                                            <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        
                                        {/* Image Preview if exists */}
                                        {hasImage ? (
                                            <div className="w-full aspect-video bg-slate-800 rounded-lg overflow-hidden relative">
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                                                    <Camera className="w-5 h-5 text-white/50" />
                                                </div>
                                                <img 
                                                    src={`${api.defaults.baseURL.replace('/api', '')}${ticket.messages.find(m => m.image).image}`} 
                                                    alt="Feedback"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full aspect-video bg-indigo-500/5 rounded-lg flex items-center justify-center border border-white/5">
                                                <FileText className="w-5 h-5 text-slate-700" />
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-white line-clamp-1 uppercase">{ticket.subject}</p>
                                            <p className="text-[9px] text-slate-500 line-clamp-2">{lastMsg?.text || ticket.message || "View details..."}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
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
                                {formatNXS(stats.communityDropFund?.total ?? stats.communityDropFund ?? 0)}
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
                    <DashboardCard href="/admin/nodes" title="Node Manager" description="USA Number Tiers" icon={Server} colorClass="blue" />
                    <DashboardCard href="/admin/memberships" title="Membership Manager" description="Silver/Gold/Platinum" icon={Gem} colorClass="amber" />
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
