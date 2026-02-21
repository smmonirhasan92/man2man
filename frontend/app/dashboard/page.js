'use client';
import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import GlobalErrorBoundary from '../../components/GlobalErrorBoundary';
import {
    Plus, ArrowDownLeft, CheckCircle, Gamepad2, Server, Briefcase, Ticket, Users, LifeBuoy, Flame, Activity, DollarSign
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { AnimatePresence, motion } from 'framer-motion';
import ConnectionFlow from '../../components/ConnectionFlow';
import ProfileDrawer from '../../components/dashboard/ProfileDrawer';
import P2PDashboard from '../../components/p2p/P2PDashboard';

export default function DashboardPage() {
    return (
        <GlobalErrorBoundary>
            <DashboardContent />
        </GlobalErrorBoundary>
    );
}

function DashboardContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [p2pMode, setP2pMode] = useState(null); // 'buy' | 'sell' | null
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const data = await authService.getCurrentUser();
            if (!data) return;

            if (data.role === 'agent') {
                router.push('/agent/dashboard');
                return;
            }
            setUser(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();

        // Socket Balance Sync
        const setupSocket = async () => {
            const getSocket = (await import('../../services/socket')).default;
            const socket = getSocket();
            if (socket && user?._id) {
                socket.on(`balance_update_${user._id}`, (newBalance) => {
                    setUser(prev => ({ ...prev, wallet_balance: newBalance }));
                });
            }
        };
        if (user?._id) setupSocket();

        return () => { };
    }, [router, user?._id]);

    const handleGridClick = (href) => {
        if (href === '#p2p-buy') {
            setP2pMode('buy');
        } else if (href === '#p2p-sell') {
            setP2pMode('sell');
        } else {
            router.push(href);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A1128] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen font-sans text-slate-200 pb-32 relative overflow-y-auto overflow-x-hidden bg-[#0A1128]">

            {/* Background Gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#0A1128] to-[#0A1128]"></div>
                <div className="absolute top-0 left-[-20%] w-[140%] h-[50vh] bg-blue-900/20 blur-[100px] rounded-full"></div>
            </div>

            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col items-center w-full max-w-md mx-auto relative z-10 px-5 pt-8 space-y-6"
            >

                {/* 1. Profile Header (Clean & Minimalist) */}
                <motion.div variants={itemVariants} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden shadow-lg hover:scale-105 transition active:scale-95 bg-slate-800 relative"
                        >
                            <img
                                src={user?.photoUrl ? `https://usaaffiliatemarketing.com/api${user.photoUrl}` : `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`}
                                alt="Profile"
                            />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Welcome back,</span>
                            <h2 className="text-base font-bold text-white leading-tight flex items-center gap-1">
                                {user?.syntheticPhone || user?.fullName?.split(' ')[0] || 'User'} <span className="text-lg">👋</span>
                            </h2>
                        </div>
                    </div>
                    {/* Hot Notification / Level Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shadow-sm">
                        <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                    </div>
                </motion.div>

                <ProfileDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    user={user}
                    logout={() => {
                        authService.logout();
                        router.push('/');
                    }}
                />

                {/* 2. Glassmorphism Balance Card */}
                <motion.div variants={itemVariants} className="w-full">
                    <BalanceCard user={user} />
                </motion.div>

                {/* 3. USA Node Connectivity Bridge */}
                <motion.div variants={itemVariants} className="w-full">
                    {user?.synthetic_phone ? (
                        <USAGatewayCard user={user} />
                    ) : (
                        <div className="w-full">
                            <Link href="/marketplace" className="block bg-red-900/40 border border-red-500/30 p-4 rounded-[20px] text-center hover:bg-red-900/60 transition backdrop-blur-md">
                                <p className="text-red-300 font-bold text-xs uppercase animate-pulse flex items-center justify-center gap-2">
                                    <Server className="w-4 h-4" /> No USA Node Connected
                                </p>
                                <p className="text-white font-medium text-sm mt-1">Rent Server to Unlock Tasks</p>
                            </Link>
                        </div>
                    )}
                </motion.div>

                {/* 4. Feature Grid (3x3 Symmetric) */}
                <motion.div variants={itemVariants} className="w-full">
                    <FeatureGrid onClick={handleGridClick} />
                </motion.div>

                {/* 5. Daily Progress Bar */}
                <motion.div variants={itemVariants} className="w-full">
                    <DailyProgress user={user} />
                </motion.div>

                {/* 6. Recent Activity Feed */}
                <motion.div variants={itemVariants} className="w-full">
                    <RecentActivity />
                </motion.div>

                {/* P2P MODAL OVERLAY */}
                <AnimatePresence>
                    {p2pMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-md h-[85vh] bg-[#0A1128] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setP2pMode(null)}
                                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition"
                                >
                                    ✕
                                </button>

                                {/* P2P Component */}
                                <div className="flex-1 overflow-y-auto">
                                    <P2PDashboard initialMode={p2pMode} />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.main>
        </div>
    );
}

// ==========================================
// NEW PREMIUM FINTECH COMPONENTS
// ==========================================

function BalanceCard({ user }) {
    const rawBalance = parseFloat(user?.wallet_balance || 0);
    const income = parseFloat(user?.wallet?.income || 0);

    // Derived USD Total (Assuming 120 BDT = 1 USD for display)
    const usdTotal = ((rawBalance + income) / 120).toFixed(2);

    return (
        <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            {/* Glow Orbs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition duration-700 group-hover:bg-blue-400/30"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition duration-700 group-hover:bg-emerald-400/20"></div>

            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                Total Balance
            </p>
            <h1 className="text-[34px] font-black text-white tracking-tight mb-5 flex items-center gap-1.5">
                <span className="text-emerald-400 text-3xl">$</span>{usdTotal}
            </h1>

            <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                <div className="flex-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Main Account</p>
                    <p className="text-base font-bold text-white tracking-wide">৳{rawBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex-1 text-right">
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Total Income</p>
                    <p className="text-base font-bold text-white tracking-wide">৳{income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
    );
}

function FeatureGrid({ onClick }) {
    const gridItems = [
        { icon: Plus, label: 'Deposit', href: '#p2p-buy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { icon: ArrowDownLeft, label: 'Withdraw', href: '#p2p-sell', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        { icon: Server, label: 'My Nodes', href: '/marketplace', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },

        { icon: CheckCircle, label: 'Daily Tasks', href: '/tasks', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        { icon: Gamepad2, label: 'Gaming', href: '/gaming-zone', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { icon: Ticket, label: 'Lottery', href: '/lottery', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },

        { icon: Briefcase, label: 'History', href: '/history', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
        { icon: Users, label: 'Invite', href: '/profile', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
        { icon: LifeBuoy, label: 'Support', href: '/support', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    ];

    return (
        <div className="w-full grid grid-cols-3 gap-3">
            {gridItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                    <button
                        key={idx}
                        onClick={() => onClick(item.href)}
                        className="flex flex-col items-center justify-center p-4 rounded-[20px] bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all shadow-sm group"
                    >
                        <div className={`w-12 h-12 rounded-[14px] ${item.bg} ${item.border} border flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 ${item.color}`} strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function DailyProgress({ user }) {
    const completed = user?.taskData?.tasksCompletedToday || 0;
    const limit = 10;
    const progress = Math.min((completed / limit) * 100, 100);

    return (
        <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

            <div className="flex justify-between items-end mb-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Daily Tasks</h3>
                        <p className="text-[10px] text-slate-400">Complete tasks to earn USA rewards</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-lg font-black text-white">{completed}<span className="text-xs text-slate-500 font-medium">/{limit}</span></span>
                </div>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative z-10 border border-slate-700/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                ></motion.div>
            </div>
        </div>
    );
}

function RecentActivity() {
    return (
        <div className="w-full">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Live Earning Feed
            </h3>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-4 flex flex-col gap-4">
                <ActivityItem title="Ad View Bonus" amount="+$0.15" time="Just now" type="income" />
                <ActivityItem title="Task Completed" amount="+$0.25" time="2 mins ago" type="income" />
                <ActivityItem title="Node Processing" amount="+$0.05" time="15 mins ago" type="income" />
                {/* Visual fading element to suggest more */}
                <div className="w-full h-8 bg-gradient-to-t from-[#0A1128] via-transparent to-transparent absolute bottom-0 left-0 rounded-b-[20px] pointer-events-none"></div>
            </div>
        </div>
    );
}

function ActivityItem({ title, amount, time, type }) {
    const isIncome = type === 'income' || type === 'deposit';
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isIncome ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <DollarSign className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="text-[13px] font-bold text-white tracking-wide">{title}</h4>
                    <p className="text-[10px] text-slate-400">{time}</p>
                </div>
            </div>
            <span className={`text-sm font-black font-mono tracking-tight ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                {amount}
            </span>
        </div>
    );
}

// ==========================================
// PRESERVED NODE CONNECTION COMPONENT
// UI Updated to match Fintech 20px radius
// ==========================================
function USAGatewayCard({ user }) {
    const [activeServer, setActiveServer] = useState(null);
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showManageModal, setShowManageModal] = useState(false);
    const [manualKey, setManualKey] = useState('');
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isDisconnectFlow, setIsDisconnectFlow] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const activeId = localStorage.getItem('active_server_id');
        const activeName = localStorage.getItem('active_server_name');
        const activePhone = localStorage.getItem('active_server_phone');

        if (activeId) {
            setActiveServer({ id: activeId, name: activeName, phone: activePhone });
        }

        const fetchServers = async () => {
            const api = (await import('../../services/api')).default;
            try {
                const { data } = await api.get('/plan/my-plans');
                setServers(data);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchServers();
    }, []);

    const handleDisconnect = () => {
        setShowManageModal(false);
        setIsDisconnecting(true);
        setIsDisconnectFlow(true);
    };

    const handleDisconnectComplete = async () => {
        localStorage.removeItem('active_server_id');
        localStorage.removeItem('active_server_name');
        localStorage.removeItem('active_server_phone');
        localStorage.removeItem('usa_connected');
        localStorage.removeItem('usa_verified_date');
        localStorage.removeItem('active_plan_id');

        setActiveServer(null);
        setIsDisconnecting(false);
        setIsDisconnectFlow(false);
        window.location.reload();
    };

    const handleManualConnect = () => {
        const normalize = (s) => s ? s.replace(/[^0-9]/g, '') : '';
        const inputClean = normalize(manualKey);
        const targetPlan = servers.find(p => normalize(p.syntheticPhone) === inputClean || normalize(p.phone) === inputClean);

        if (targetPlan) {
            localStorage.setItem('active_server_id', targetPlan._id || targetPlan.id);
            localStorage.setItem('active_plan_id', targetPlan.planId?._id || targetPlan.planId);
            localStorage.setItem('active_server_name', targetPlan.name || targetPlan.planName);
            localStorage.setItem('active_server_phone', targetPlan.syntheticPhone);
            localStorage.setItem('usa_connected', 'true');

            const toast = require('react-hot-toast').default;
            toast.success(`Secure Connection: ${targetPlan.syntheticPhone}`, {
                icon: '🔒', duration: 2000
            });
            setTimeout(() => window.location.reload(), 1500);
        } else {
            const toast = require('react-hot-toast').default;
            toast.error("Node Not Found.", { duration: 2000 });
        }
    };

    if (loading) return <div className="w-full h-[76px] bg-white/5 rounded-[20px] animate-pulse"></div>;

    if (showManageModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-[#0A1128] w-full max-w-sm rounded-[24px] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-5 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Node Setup</h3>
                        <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    <div className="p-6 flex flex-col items-center gap-6">
                        {activeServer ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                                    <Server className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-black text-white mb-1 tracking-wide">{activeServer.name}</h2>
                                    <p className="text-emerald-400 font-mono text-sm">{activeServer.phone || 'Verifying ID...'}</p>
                                    <p className="text-emerald-500/50 text-[10px] mt-2 uppercase tracking-widest font-bold">Encrypted Active</p>
                                </div>

                                <button
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    className="w-full py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold uppercase text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isDisconnecting ? 'TERMINATING...' : 'DISCONNECT NODE'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center w-full">
                                <p className="text-slate-400 text-xs mb-4">Select Node to connect:</p>
                                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                                    {servers.map(srv => (
                                        <button
                                            key={srv._id || srv.id}
                                            onClick={() => { setManualKey(srv.syntheticPhone); handleManualConnect(); }}
                                            className="w-full px-4 py-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/10 hover:border-blue-500/50 group"
                                        >
                                            <span className="text-xs font-bold text-slate-300">{srv.planName || 'Server'}</span>
                                            <span className="text-[10px] font-mono text-slate-500">{srv.syntheticPhone}</span>
                                        </button>
                                    ))}
                                    {servers.length === 0 && <p className="text-xs text-slate-500 italic">No servers active.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (activeServer) {
        return (
            <div className="w-full animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/40 backdrop-blur-md rounded-[20px] p-4 border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                NODE ONLINE
                            </h3>
                            <p className="text-white font-bold text-sm truncate max-w-[150px]">{activeServer.name}</p>
                        </div>
                        <button
                            onClick={() => setShowManageModal(true)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20 transition"
                        >
                            MANAGE
                        </button>
                    </div>
                </div>
                <AnimatePresence>
                    {isDisconnectFlow && (
                        <ConnectionFlow plan={{ serverIp: '104.28.XX.XX', syntheticPhone: activeServer.phone }} mode="disconnect" onComplete={handleDisconnectComplete} />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (servers.length > 0) {
        return (
            <div className="w-full animate-in fade-in slide-in-from-top-4 duration-700 relative z-20">
                <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-md rounded-[20px] p-4 border border-blue-500/30 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-[9px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                NODE DISCONNECTED
                            </h3>
                            <p className="text-white font-bold text-sm tracking-wide">{servers.length} Available</p>
                        </div>
                        <button
                            onClick={() => setShowManageModal(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition active:scale-95"
                        >
                            CONNECT
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
