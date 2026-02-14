'use client';
import { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageSlider from '../../components/ImageSlider';
import Loading from '../../components/Loading';

import GlobalErrorBoundary from '../../components/GlobalErrorBoundary';
import {
    Headset, Wallet, TrendingUp, Zap, Plus, ArrowDownLeft, CheckCircle, ChevronRight, Gamepad2, Eye, EyeOff, Smartphone, Briefcase, Send, Ticket, Server, Copy, MessageSquare, Shield, Lock
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { AnimatePresence } from 'framer-motion';
import ConnectionFlow from '../../components/ConnectionFlow';


export default function DashboardPage() {
    return (
        <GlobalErrorBoundary>
            <DashboardContent />
        </GlobalErrorBoundary>
    );
}

// --- 3-Section Dashboard Refactor ---
import TaskCenter from '../../components/dashboard/TaskCenter';
import TurnoverTracker from '../../components/dashboard/TurnoverTracker';

// --- Supreme Dashboard & Wallet Update ---
import TaskPanel from '../../components/tasks/TaskPanel';
import HeaderBalance from '../../components/layout/HeaderBalance';
import IncomeDisplay from '../../components/layout/IncomeDisplay';
import WalletSwap from '../../components/wallet/WalletSwap';
import ProfileDrawer from '../../components/dashboard/ProfileDrawer'; // [NEW]
// import PremiumLottery from '../../components/lottery/PremiumLottery'; // [REMOVED FOR SPEED]
import P2PDashboard from '../../components/p2p/P2PDashboard'; // [NEW] P2P Integrated

function DashboardContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // [NEW]
    const [p2pMode, setP2pMode] = useState(null); // 'buy' | 'sell' | null
    const router = useRouter();
    const { formatMoney } = useCurrency();

    const fetchUser = async () => {
        try {
            const data = await authService.getCurrentUser();
            if (!data) return; // [FIX] Prevent crash if API fails

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
            const socket = getSocket(); // Initialize
            if (socket && user?._id) {
                socket.on(`balance_update_${user._id}`, (newBalance) => {
                    setUser(prev => ({ ...prev, wallet_balance: newBalance }));
                });
            }
        };
        if (user?._id) setupSocket();

        return () => {
            // Cleanup provided by socket service singleton
        };
    }, [router, user?._id]);

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen font-sans text-slate-200 pb-32 relative overflow-y-auto overflow-x-hidden bg-[#0A2540]">

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/bg-flag.png')] bg-cover bg-center opacity-70"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A2540]/90 via-[#0A2540]/70 to-[#0A2540]"></div>
            </div>

            <main className="flex flex-col items-center w-full max-w-md mx-auto relative z-10 space-y-2">

                {/* 1. Header (Re-Engineered) */}
                <div className="w-full px-6 pt-8 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDrawerOpen(true)} // [NEW] Open Drawer
                            className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-white/10 hover:scale-105 transition active:scale-95"
                        >
                            <img
                                src={user?.photoUrl ? `https://usaaffiliatemarketing.com/api${user.photoUrl}` : `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`}
                                alt="Profile"
                            />
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-wide leading-none">
                                {/* STEALTH: Show Synthetic USA Phone instead of Name/Real Phone */}
                                {user?.syntheticPhone || user?.fullName?.split(' ')[0] || 'User'} 🇺🇸
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-mono flex gap-2">
                                    ID: {user?.referralCode || '---'}
                                    {user?.referralSecurity?.expiresAt && (
                                        <span className="text-red-400">
                                            (Exp: {new Date(user.referralSecurity.expiresAt).toLocaleDateString()})
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Interactive Balance Button */}
                    <div className="flex items-center gap-2">
                        <IncomeDisplay amount={user?.wallet?.income} />
                        <HeaderBalance balance={user?.wallet_balance} />
                    </div>
                </div>

                <ProfileDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    user={user}
                    logout={() => {
                        authService.logout();
                        router.push('/');
                    }}
                />

                {/* [NEW] USA Server Card - Verification Bridge */}
                {user?.synthetic_phone ? (
                    <USAGatewayCard user={user} />
                ) : (
                    <div className="w-full px-6 mb-2">
                        <Link href="/marketplace" className="block bg-red-900/50 border border-red-500/50 p-4 rounded-xl text-center hover:bg-red-900/70 transition">
                            <p className="text-red-200 font-bold text-xs uppercase animate-pulse">⚠️ No USA Connection Found</p>
                            <p className="text-white font-bold text-sm mt-1">Rent Server to Unlock Verification Key</p>
                        </Link>
                    </div>
                )}



                {/* 2. Slider */}
                <div className="w-full px-6 relative z-0 mb-4">
                    <div className="p-1 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 relative bg-white/5 backdrop-blur-sm">
                        <ImageSlider />
                    </div>
                </div>

                {/* 2.5 Finance Priority Actions [NEW LEVEL 2] */}
                <div className="w-full px-6 mb-6 grid grid-cols-2 gap-4">
                    <Link href="/p2p" className="bg-[#0f1f33] border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#132840] hover:border-emerald-500/60 transition shadow-xl group relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" strokeWidth={3} />
                        </div>
                        <span className="text-white font-black text-sm uppercase tracking-widest mt-1">Deposit</span>
                    </Link>

                    <Link href="/p2p" className="bg-[#0f1f33] border border-red-500/30 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#132840] hover:border-red-500/60 transition shadow-xl group relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] group-hover:scale-110 transition-transform">
                            <ArrowDownLeft className="w-6 h-6" strokeWidth={3} />
                        </div>
                        <span className="text-white font-black text-sm uppercase tracking-widest mt-1">Withdraw</span>
                    </Link>
                </div>

                {/* 3. Income Task Panel (Botanical Gold) */}
                <TaskPanel user={user} />

                {/* 4. Wallet Bridge (Swap) */}
                <WalletSwap user={user} onSuccess={fetchUser} />

                {/* 4. Lottery Highlight [NEW LEVEL 4 - STATIC SPEED LINK] */}
                <div className="w-full px-6 mb-8 relative">
                    <div className="absolute -top-3 right-6 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-lg z-20">
                        HOT 🔥
                    </div>
                    <Link href="/lottery" className="block p-1 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 shadow-[0_0_25px_rgba(234,179,8,0.15)] border border-yellow-500/30 hover:scale-[1.02] transition-transform">
                        <div className="bg-[#1a1825] p-4 rounded-xl flex justify-between items-center relative overflow-hidden group">
                            {/* Static Visuals */}
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-white italic tracking-wider">PREMIUM LOTTERY</h3>
                                <p className="text-xs text-yellow-400 font-bold mt-1 flex items-center gap-1">
                                    <Ticket className="w-3 h-3" /> Live Draw Room
                                </p>
                            </div>
                            <div className="text-right z-10">
                                <span className="block text-2xl font-black text-white">৳ 50,000+</span>
                                <span className="text-[10px] text-slate-400">Daily Prize Pool</span>
                            </div>

                            {/* Decor */}
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition"></div>
                        </div>
                    </Link>
                </div>

                {/* 5. Universal Game UI (4 Themes) [NEW LEVEL 5] */}
                <div className="w-full px-6 mb-4">
                    {/* NEW: PRO GAMING ZONE */}
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 tracking-widest">
                            <Zap className="w-4 h-4 text-yellow-400" /> PRO GAMING ZONE
                        </h3>
                        <Link href="/gaming-zone" className="text-[10px] text-cyan-400 font-bold hover:underline">
                            VIEW ALL
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* 3. Aviator */}
                        <div className="col-span-2">
                            <GameCard
                                title="Aviator"
                                desc="Crash Game"
                                href="/game/aviator"
                                icon="✈️"
                                colors="from-red-900 to-rose-950 border-white/20"
                            />
                        </div>
                        {/* 4. Coming Soon (Placeholder for Expansion) */}
                        <div className="h-32 rounded-2xl overflow-hidden border border-white/5 bg-white/5 flex flex-col items-center justify-center opacity-50">
                            <span className="text-2xl">🔒</span>
                            <span className="text-[10px] font-bold uppercase mt-2">Coming Soon</span>
                        </div>
                    </div>
                </div>

                {/* 6. Secondary Actions */}
                <div className="w-full px-6 mb-8 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Keeping History */}
                        <FolderCard href="/history" icon={Briefcase} label="History" color="text-purple-400" gradient="from-purple-600/20 to-purple-900/40" border="border-white/20" />

                        {/* Adding Support/Help as filler? Or just centering History? 
                             Let's keep it clean. Just History. Or maybe 'Servers' shortcut?
                             I'll put 'My Plan' shortcut.
                         */}
                        <FolderCard href="/marketplace" icon={Server} label="My Nodes" color="text-blue-400" gradient="from-blue-600/20 to-blue-900/40" border="border-white/20" />
                    </div>
                </div>

                {/* P2P MODAL OVERLAY */}
                {p2pMode && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-md h-[85vh] bg-[#0a0f1e] rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col">
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
                        </div>
                    </div>
                )}





                {/* TRUST BADGE */}
                <div className="w-full text-center pb-8 opacity-50">
                    <div className="flex justify-center gap-4 mb-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <Server className="w-4 h-4 text-blue-500" />
                        <Lock className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">SECURED BY MAN2MAN BLOCKCHAIN</p>
                </div>

            </main>
        </div>
    );
}

// Optimized Game Card
function GameCard({ title, desc, href, icon, colors }) {
    return (
        <Link href={href} className={`group relative h-32 rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}>
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                <div className="text-3xl filter drop-shadow-md">{icon}</div>
                <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{title}</h4>
                    <p className="text-[10px] text-white/70">{desc}</p>
                </div>
            </div>
        </Link>
    );
}

// [NEW] Server Connectivity Center with Manual Control
function USAGatewayCard({ user }) {
    const [activeServer, setActiveServer] = useState(null);
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showManageModal, setShowManageModal] = useState(false);
    const [manualKey, setManualKey] = useState('');
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // 1. Load Local State
        const activeId = localStorage.getItem('active_server_id');
        const activeName = localStorage.getItem('active_server_name');
        const activePhone = localStorage.getItem('active_server_phone');

        if (activeId) {
            setActiveServer({ id: activeId, name: activeName, phone: activePhone });
        }

        // 2. Fetch User's Plans for Validation
        const fetchServers = async () => {
            // Dynamic import to avoid SSR issues if any
            const api = (await import('../../services/api')).default;
            try {
                const { data } = await api.get('/plan/my-plans');
                setServers(data);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchServers();
    }, []);

    const [isDisconnectFlow, setIsDisconnectFlow] = useState(false);



    const handleDisconnect = () => {
        // [ANIMATION UPGRADE] Trigger ConnectionFlow in 'disconnect' mode
        setShowManageModal(false); // Close modal first
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

        // No reload needed if state is managed well, but force reload ensures clean slate if preferred
        window.location.reload();
    };

    const handleManualConnect = () => {
        // Validation
        const normalize = (s) => s ? s.replace(/[^0-9]/g, '') : '';
        const inputClean = normalize(manualKey);

        const targetPlan = servers.find(p => normalize(p.syntheticPhone) === inputClean || normalize(p.phone) === inputClean);

        if (targetPlan) {
            // Success: Switch Context
            localStorage.setItem('active_server_id', targetPlan._id || targetPlan.id);
            localStorage.setItem('active_plan_id', targetPlan.planId?._id || targetPlan.planId); // [NEW] Bind Plan ID
            localStorage.setItem('active_server_name', targetPlan.name || targetPlan.planName);
            localStorage.setItem('active_server_phone', targetPlan.syntheticPhone);
            localStorage.setItem('usa_connected', 'true');

            // [FIX] Professional Toast + Delayed Reload
            const toast = require('react-hot-toast').default;
            toast.success(`Secure Connection Established: ${targetPlan.syntheticPhone}`, {
                style: { background: '#064E3B', color: '#fff', border: '1px solid #10B981' },
                icon: '🔒',
                duration: 2000
            });
            setTimeout(() => window.location.reload(), 1500);
        } else {
            const toast = require('react-hot-toast').default;
            toast.error("Node Not Found. Please check 'My Servers' list.", {
                style: { background: '#7F1D1D', color: '#fff', border: '1px solid #EF4444' }
            });
        }
    };

    if (loading) return <div className="w-full px-6 mb-2 h-20 bg-slate-800/50 rounded-xl animate-pulse"></div>;

    // MODAL
    if (showManageModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <div className="bg-[#112240] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-4 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Node Management</h3>
                        <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>

                    <div className="p-6 flex flex-col items-center gap-6">
                        {activeServer ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <Server className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-white mb-1">{activeServer.name}</h2>
                                    <p className="text-emerald-400 font-mono text-sm">{activeServer.phone || 'Verifying ID...'}</p>
                                    <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-tight">Encrypted Session Active</p>
                                </div>

                                <button
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    className="w-full py-3 bg-red-600/20 border border-red-500/50 text-red-400 font-black uppercase text-xs rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    {isDisconnecting ? 'TERMINATING...' : 'DISCONNECT NODE'}
                                </button>
                            </>
                        ) : (
                            <div className="text-center w-full">
                                <p className="text-slate-400 text-xs mb-4">Select a method to connect:</p>

                                {/* AUTO CONNECT BUTTONS */}
                                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                                    {servers.map(srv => (
                                        <button
                                            key={srv._id || srv.id}
                                            onClick={() => {
                                                setManualKey(srv.syntheticPhone);
                                                handleManualConnect(); // Auto-trigger for click
                                            }}
                                            className="w-full p-3 bg-slate-800 rounded-lg flex items-center justify-between border border-white/5 hover:border-blue-500/50 group"
                                        >
                                            <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400">{srv.planName || 'Server'}</span>
                                            <span className="text-[10px] font-mono text-slate-500">{srv.syntheticPhone}</span>
                                        </button>
                                    ))}
                                    {servers.length === 0 && <p className="text-xs text-slate-500 italic">No servers purchased yet.</p>}
                                </div>

                                {/* MANUAL INPUT - RESTORED VIA REQUEST */}
                                <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                                    <label className="text-[9px] text-slate-500 uppercase font-bold block mb-2 text-left">Manual Sync (Backdoor)</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={manualKey}
                                            onChange={(e) => setManualKey(e.target.value)}
                                            placeholder="+1 (XXX) ..."
                                            className="bg-transparent border-b border-slate-600 text-white font-mono text-xs w-full outline-none focus:border-blue-500"
                                        />
                                        <button onClick={handleManualConnect} className="text-[10px] bg-blue-600 px-3 py-1 rounded text-white font-bold">SYNC</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // SCENARIO 1: CONNECTED
    if (activeServer) {
        return (
            <div className="w-full px-6 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-gradient-to-r from-emerald-900 to-green-900 rounded-xl p-4 border border-emerald-500/30 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                SYSTEM ONLINE
                            </h3>
                            <p className="text-white font-bold text-sm">Connected: {activeServer.name}</p>
                        </div>
                        <button
                            onClick={() => setShowManageModal(true)} // [FIX] Open Modal
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30"
                        >
                            MANAGE
                        </button>
                    </div>
                </div>
                {/* CONNECT / DISCONNECT ANIMATION OVERLAY */}
                <AnimatePresence>
                    {isDisconnectFlow && (
                        <ConnectionFlow
                            plan={{ serverIp: '104.28.XX.XX', syntheticPhone: activeServer.phone }}
                            mode="disconnect"
                            onComplete={handleDisconnectComplete}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // SCENARIO 2: NOT CONNECTED BUT HAS SERVERS
    if (servers.length > 0) {
        return (
            <div className="w-full px-6 mb-2 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-4 border border-indigo-500/50 shadow-lg relative overflow-hidden group">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                DISCONNECTED
                            </h3>
                            <p className="text-white font-bold text-sm">{servers.length} Server(s) Available</p>
                        </div>
                        <button
                            onClick={() => setShowManageModal(true)} // [FIX] Open Modal to Connect
                            className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 animate-pulse"
                        >
                            CONNECT NOW
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // SCENARIO 3: NO SERVERS
    return (
        <div className="w-full px-6 mb-2">
            <Link href="/marketplace" className="block bg-red-900/50 border border-red-500/50 p-4 rounded-xl text-center hover:bg-red-900/70 transition">
                <p className="text-red-200 font-bold text-xs uppercase animate-pulse">⚠️ No USA Connection Found</p>
                <p className="text-white font-bold text-sm mt-1">Rent Server to Unlock Verification Key</p>
            </Link>

            {/* CONNECT / DISCONNECT ANIMATION OVERLAY */}
            <AnimatePresence>
                {isDisconnectFlow && activeServer && (
                    <ConnectionFlow
                        plan={{ serverIp: '104.28.XX.XX', syntheticPhone: activeServer.phone }}
                        mode="disconnect"
                        onComplete={handleDisconnectComplete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Glass Card Component
function FolderCard({ href, icon: Icon, label, color, gradient, border }) {
    return (
        <Link href={href} className={`p-3 rounded-2xl ${border} bg-white/5 backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 flex flex-col items-center gap-2 text-center aspect-square justify-center hover:bg-white/10 hover:shadow-lg hover:shadow-${color.replace('text-', '')}/20`}>
            {/* Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

            {/* Icon Box: Updated to White Glass style as requested */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20 ${color} relative z-10 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)]`}>
                <Icon className="w-6 h-6" strokeWidth={2.5} />
            </div>

            <h4 className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors relative z-10 uppercase tracking-tight">{label}</h4>
        </Link>
    );
}
