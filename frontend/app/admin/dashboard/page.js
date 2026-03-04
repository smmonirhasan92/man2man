'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { ArrowLeft, Users, FileText, Settings, Shield, ShieldCheck, Wallet, Trophy, Briefcase, Crown, MessageSquare, Ticket, Lock, Zap, Activity, Gem, ClipboardList, Bell, TrendingUp, AlertTriangle } from 'lucide-react';
import DashboardCard from '../../../components/admin/DashboardCard';
import LiveVaultTracker from '../../../components/admin/LiveVaultTracker';
import EcosystemTracker from '../../../components/admin/EcosystemTracker';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        overview: {
            today_deposits: 0,
            today_withdraws: 0,
            total_created: 0,
            total_withdraws: 0,
            pending_deposits: 0,
            pending_withdraws: 0
        },
        actual: {
            user_main_balances: 0,
            user_game_balances: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [maintenance, setMaintenance] = useState(false);
    const [updatingMaint, setUpdatingMaint] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Financials
                const finRes = await api.get('/admin/audit/financial');
                const overview = finRes.data.overview || {};
                const actual = finRes.data.actual || {};
                const eco = finRes.data.economics || {};

                setStats({
                    ...eco, // spreads our new totalDeposits, totalServerRevenue, netSystemProfit, etc.
                    todayDeposits: overview.today_deposits || eco.totalDeposits || 0,
                    todayWithdraws: overview.today_withdraws || eco.totalWithdraws || 0,
                    totalCreated: overview.total_created || 0,
                    totalWithdraws: overview.total_withdraws || eco.totalWithdraws || 0,
                    userMainBalance: actual.user_main_balances || 0,
                    userGameBalance: actual.user_game_balances || 0,
                    pendingActions: (overview.pending_deposits || 0) + (overview.pending_withdraws || 0)
                });

                // 2. Maintenance Status
                const sysRes = await api.get('/admin/settings/public');
                if (sysRes.data.maintenance?.isActive) setMaintenance(true);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
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

    return (
        <div className="min-h-screen bg-[#050505] font-sans pb-20 text-white">
            {/* BACKGROUND VFX */}
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Header Section */}
            <header className="bg-[#0D0D0D] border-b border-[#D4AF37]/20 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="w-full px-6 lg:px-10 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-white/10 transition">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <h1 className="text-xl font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6" /> Admin Console
                        </h1>
                    </div>

                    {/* Maintenance Toggle */}
                    <button
                        onClick={toggleMaintenance}
                        disabled={updatingMaint}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase transition-all shadow-lg ${maintenance
                            ? 'bg-red-500 text-white shadow-red-500/20 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                    >
                        {updatingMaint ? (
                            <Activity className="w-3 h-3 animate-spin" />
                        ) : (
                            maintenance ? <Lock className="w-3 h-3" /> : <Zap className="w-3 h-3" />
                        )}
                        {maintenance ? 'System Locked' : 'System Live'}
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="w-full px-6 lg:px-10 py-8 relative z-10">
                {/* LIVE VAULT TRACKER */}
                <LiveVaultTracker />

                {/* ECOSYSTEM RECOVERY TRACKER */}
                <EcosystemTracker />

                {/* 1. FINANCIAL SUMMARY CARD */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Activity className="text-blue-500" />
                        Global System Economics
                    </h2>
                    {stats.pendingActions > 0 && (
                        <Link href="/admin/transactions" className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 flex items-center gap-2 hover:bg-red-500/20 transition animate-pulse">
                            {stats.pendingActions} Actionable Requests &rarr;
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Card 1: Deposits & Withdrawals */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10">Lifetime Cash Flow</h3>
                        <div className="flex flex-col gap-2 relative z-10 mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">TOTAL DEPOSITED</span>
                                <span className="text-base font-mono font-bold text-white">৳{Number(stats.totalDeposits || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">TOTAL WITHDRAWN</span>
                                <span className="text-base font-mono font-bold text-white">৳{Number(stats.totalWithdraws || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Server Revenue (Recovery) */}
                    <div className="bg-[#0f0f0f] border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-16 h-16 text-blue-500" /></div>
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10">Server Revenue & Recovery</h3>
                        <div className="text-2xl font-black text-white relative z-10">
                            ৳{Number(stats.totalServerRevenue || 0).toLocaleString()}
                        </div>
                        <div className="mt-2 space-y-1">
                            <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>+ P2P Fees:</span> <span className="text-white">৳{Number(stats.totalP2PFee || 0).toLocaleString()}</span></div>
                            <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>+ Lottery Sales:</span> <span className="text-white">৳{Number(stats.totalLotteryRevenue || 0).toLocaleString()}</span></div>
                        </div>
                    </div>

                    {/* Card 3: Income Given (Liability) */}
                    <div className="bg-[#0f0f0f] border border-orange-500/20 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-orange-500" /></div>
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10">Total Income Given</h3>
                        <div className="text-2xl font-black text-white relative z-10">
                            ৳{Number(stats.totalIncomeGiven || 0).toLocaleString()}
                        </div>
                        <div className="mt-2 space-y-1">
                            <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>Tasks Earned:</span> <span className="text-white">৳{Number(stats.totalTaskIncome || 0).toLocaleString()}</span></div>
                            <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>Lottery Prizes:</span> <span className="text-white">৳{Number(stats.totalLotteryPrizes || 0).toLocaleString()}</span></div>
                            <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>Referral Bonus:</span> <span className="text-white">৳{Number(stats.totalReferralBonus || 0).toLocaleString()}</span></div>
                        </div>
                    </div>

                    {/* Card 4: Net Profit */}
                    <div className={`bg-[#0f0f0f] border ${(stats.netSystemProfit || 0) >= 0 ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'} p-5 rounded-2xl relative overflow-hidden group`}>
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10">Net System Profit (Rev - Income)</h3>
                        <div className="text-3xl font-black text-white relative z-10 flex items-baseline gap-1">
                            <span className="text-sm text-slate-500">৳</span>
                            {Number(stats.netSystemProfit || 0).toLocaleString()}
                        </div>
                        <div className="mt-3 text-xs w-full relative z-10">
                            {(stats.netSystemProfit || 0) >= 0 ? (
                                <div className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1.5 rounded text-center border border-emerald-500/20">
                                    PROFIT / RECOVERY MODE
                                </div>
                            ) : (
                                <div className="text-red-400 font-bold bg-red-500/10 px-2 py-1.5 rounded text-center border border-red-500/20 animate-pulse">
                                    CRITICAL LIABILITY / LOSS
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DASHBOARD GRID (2-Column Strict) */}
                <div className="grid grid-cols-2 gap-4">
                    <DashboardCard href="/admin/transactions" title="Transactions" description="Deposits & Payouts" icon={FileText} colorClass="blue" badge={stats.pendingActions > 0 ? `${stats.pendingActions}` : ''} />
                    <DashboardCard href="/admin/users" title="Manage Users" description="Edit, Ban, Verify" icon={Users} colorClass="indigo" />
                    <DashboardCard href="/admin/agents" title="Agent Network" description="Commission & Trees" icon={Briefcase} colorClass="green" />
                    <DashboardCard href="/admin/plans" title="Plan Manager" description="Create/Edit Tiers" icon={Gem} colorClass="amber" />
                    <DashboardCard href="/admin/tasks" title="Manage 20 Tasks" description="Edit Video Ads" icon={ClipboardList} colorClass="cyan" />
                    <DashboardCard href="/admin/settings" title="System Settings" description="Global Config" icon={Settings} colorClass="gray" />
                    <DashboardCard href="/admin/audit" title="Financial Audit" description="Profit/Loss Reports" icon={Shield} colorClass="red" />

                    <DashboardCard href="/admin/lottery" title="Lottery Control" description="Draws & Tickets" icon={Ticket} colorClass="pink" />
                    <DashboardCard href="/admin/support" title="User Support" description="Help & Tickets" icon={MessageSquare} colorClass="cyan" />

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
