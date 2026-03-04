'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { ArrowLeft, Users, FileText, Settings, Shield, ShieldCheck, Wallet, Briefcase, MessageSquare, Ticket, Lock, Zap, Activity, Gem, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import DashboardCard from '../../../components/admin/DashboardCard';
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
                    ...eco, // spreads totalUsers, totalDeposits, totalServerRevenue, etc.
                    currentLiabilities: overview.current_liabilities || 0,
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
                {/* SIMPLE STATS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {/* 1. Total Users */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Users</h3>
                        <div className="text-2xl font-black text-white">{Number(stats.totalUsers || 0).toLocaleString()}</div>
                    </div>

                    {/* 2. User Wallets */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <Wallet className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">User Wallets</h3>
                        <div className="text-2xl font-black text-white">৳{Number(stats.currentLiabilities || 0).toLocaleString()}</div>
                    </div>

                    {/* 3. Total Deposits */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Deposits</h3>
                        <div className="text-2xl font-black text-white">৳{Number(stats.totalDeposits || 0).toLocaleString()}</div>
                    </div>

                    {/* 4. Total Withdrawals */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <ArrowLeft className="w-8 h-8 text-rose-500 mx-auto mb-2 -rotate-[135deg]" />
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Withdrawals</h3>
                        <div className="text-2xl font-black text-white">৳{Number(stats.totalWithdraws || 0).toLocaleString()}</div>
                    </div>

                    {/* 5. Server Sales */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <ShieldCheck className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Server Sales</h3>
                        <div className="text-2xl font-black text-white">৳{Number(stats.totalServerRevenue || 0).toLocaleString()}</div>
                    </div>

                    {/* 6. Task Earnings */}
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <Activity className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Task Earnings</h3>
                        <div className="text-2xl font-black text-white">৳{Number(stats.totalTaskIncome || 0).toLocaleString()}</div>
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
