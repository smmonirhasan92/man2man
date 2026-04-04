'use client';
import { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ImageSlider from '../../components/ImageSlider';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import GlobalErrorBoundary from '../../components/GlobalErrorBoundary';
import {
    Plus, ArrowDownLeft, Server, Briefcase, Ticket, Users, LifeBuoy, Gamepad2, Shield, Lock, DollarSign, Wallet, Globe, ArrowRight, Gift, Zap
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { AnimatePresence } from 'framer-motion';

import TaskPanel from '../../components/tasks/TaskPanel';
import UnifiedWallet from '../../components/layout/UnifiedWallet';
import WalletSwap from '../../components/wallet/WalletSwap';
import ProfileDrawer from '../../components/dashboard/ProfileDrawer';
import P2PDashboard from '../../components/p2p/P2PDashboard';
import GiftBox from '../../components/gamification/GiftBox';
import NodeCarousel from '../../components/dashboard/NodeCarousel';
import VPSConnectModal from '../../components/VPSConnectModal';
import api from '../../services/api';

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return (
         <div className="min-h-screen font-sans bg-[#0A2540] relative">
            <DashboardSkeleton />
        </div>
    );

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
    const [activeNodeId, setActiveNodeId] = useState(null);
    const [connectingNode, setConnectingNode] = useState(null);
    const router = useRouter();
    const { formatMoney } = useCurrency();

    const fetchUser = async () => {
        try {
            const data = await authService.getCurrentUser();
            if (!data) return;

            setUser(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();

        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('active_server_id');
            if (storedId) setActiveNodeId(storedId);
        }

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
    }, [user?._id]);

    // Handle initial active node selection
    useEffect(() => {
        if (user?.active_plans?.length > 0 && !activeNodeId) {
            const firstNode = user.active_plans[0];
            setActiveNodeId(firstNode.id);
            localStorage.setItem('active_server_id', firstNode.id);
            localStorage.setItem('active_server_phone', firstNode.syntheticPhone);
            localStorage.setItem('active_server_name', firstNode.planName);
        }
    }, [user, activeNodeId]);

    const handleNodeSelect = (node) => {
        setConnectingNode(node);
    };

    const handleConnectComplete = () => {
        if (!connectingNode) return;
        
        const node = connectingNode;
        setActiveNodeId(node.id);
        localStorage.setItem('active_server_id', node.id);
        localStorage.setItem('active_server_phone', node.syntheticPhone);
        localStorage.setItem('active_server_name', node.planName);
        localStorage.setItem('usa_connected', 'true');
        
        setConnectingNode(null);
        toast.success(`Connected to ${node.planName}`, {
            icon: '🛡️',
            style: { background: '#064E3B', color: '#fff' }
        });

        // [v6.2] Auto-Redirect to Tasks Center as requested
        setTimeout(() => {
            router.push('/tasks');
        }, 800);
    };

    if (loading) return (
        <div className="min-h-screen font-sans bg-[#0A2540] relative">
            <DashboardSkeleton />
        </div>
    );

    return (
        <div className="min-h-screen font-sans text-slate-200 pb-32 relative overflow-y-auto overflow-x-hidden bg-[#0A2540]">

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1080')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A2540] via-[#0A2540]/80 to-[#0A2540]"></div>
            </div>

            <main className="flex flex-col items-center w-full max-w-md mx-auto relative z-10 space-y-2">

                {/* Header */}
                <div className="w-full px-6 pt-8 pb-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 overflow-hidden shadow-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Shield size={16} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-white tracking-wide leading-none uppercase">
                                SECURE 🇺🇸
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-mono flex items-center gap-1 border border-emerald-500/20">
                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM LIVE
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 max-w-[245px] flex justify-end">
                        <UnifiedWallet balance={user?.wallet_balance} income={user?.wallet?.income} />
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

                <div className="w-full px-6 relative z-0 mb-4">
                    <div className="p-1 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative bg-white/5 backdrop-blur-sm">
                        <ImageSlider />
                    </div>
                </div>

                {/* USA Node Management */}
                <div className="w-full">
                    {user?.active_plans?.length > 0 && (
                        <NodeCarousel 
                            plans={user.active_plans} 
                            activeId={activeNodeId} 
                            connectingId={connectingNode?.id}
                            onSelect={handleNodeSelect} 
                        />
                    )}
                </div>

                {/* VPS Server Marketplace Entry */}
                <div className="w-full px-6 mb-4">
                    <button 
                        onClick={() => router.push('/marketplace')} 
                        className="w-full bg-blue-500/10 border border-blue-500/20 p-5 rounded-[2rem] flex items-center justify-between hover:bg-blue-500/20 transition group shadow-xl backdrop-blur-md"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <Globe size={28} strokeWidth={2.5} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-white font-black text-base uppercase tracking-tight">VPS Server Marketplace</h3>
                                <p className="text-slate-400 text-xs mt-1 font-medium">Explore & Deploy Verified Nodes</p>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="w-full px-6 mb-4 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setP2pMode('buy')} 
                        className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/10 transition group shadow-xl backdrop-blur-md"
                    >
                        <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Plus size={20} strokeWidth={3} />
                        </div>
                        <span className="text-white font-black text-xs uppercase tracking-widest mt-1">Buy NXS</span>
                    </button>

                    <button 
                        onClick={() => setP2pMode('sell')} 
                        className="bg-red-500/5 border border-red-500/20 p-5 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-red-500/10 transition group shadow-xl backdrop-blur-md"
                    >
                        <div className="p-2.5 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                            <ArrowDownLeft size={20} strokeWidth={3} />
                        </div>
                        <span className="text-white font-black text-xs uppercase tracking-widest mt-1">Sell NXS</span>
                    </button>
                </div>

                <WalletSwap user={user} onSuccess={fetchUser} />


                {/* Grid Functions [V7.0 PRO] */}
                <div className="w-full px-6 mb-8 mt-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Discover Options</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Core Features */}
                        <FolderCard href="/dashboard/invest" icon={DollarSign} label="Invest" color="text-emerald-400" gradient="from-emerald-600/20 to-emerald-900/40" border="border-emerald-500/30" />
                        
                        <div className="relative group">
                            <FolderCard href="/dashboard/luck-test" icon={Gamepad2} label="Luck Test" color="text-orange-400" gradient="from-orange-600/20 to-orange-900/40" border="border-orange-500/30" />
                        </div>

                        <div className="relative group">
                            <FolderCard href="/dashboard/scratch-card" icon={Ticket} label="Scratch Card" color="text-amber-400" gradient="from-amber-600/20 to-amber-900/40" border="border-amber-500/30" />
                        </div>

                        <div className="relative group">
                            <FolderCard href="/lottery" icon={Ticket} label="Lottery" color="text-purple-400" gradient="from-purple-600/20 to-purple-900/40" border="border-purple-500/30" />
                            <div className="absolute -top-2 -right-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg border border-white/20 animate-pulse">JACKPOT</div>
                        </div>

                        {/* Mystery Box (Replaced Floating Bubble) */}
                        <div className="relative group cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('toggle-mystery-box'))}>
                            <FolderCard href="#" icon={Gift} label="Gift Box" color="text-pink-400" gradient="from-pink-600/20 to-pink-900/40" border="border-pink-500/30" />
                            <div className="absolute -top-2 -right-1 bg-gradient-to-r from-rose-500 to-red-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg border border-white/20 animate-bounce">FREE</div>
                        </div>

                        <FolderCard href="/history" icon={Briefcase} label="History" color="text-indigo-400" gradient="from-indigo-600/20 to-indigo-900/40" border="border-white/20" />
                        
                        <FolderCard href="#" icon={Zap} label="AI Node Center" color="text-yellow-400" gradient="from-yellow-600/20 to-yellow-900/40" border="border-yellow-500/30" onClick={() => toast('AI Deployment Center: Beta coming soon!', { icon: '🚀', style: { borderRadius: '10px', background: '#333', color: '#fff' } })} />

                        {/* Dummy Feature for Testing Local-to-VPS Deployment Pipeline */}
                        <FolderCard href="#" icon={Zap} label="AI Note 2" color="text-cyan-400" gradient="from-cyan-600/20 to-cyan-900/40" border="border-cyan-500/30" onClick={() => toast('AI Note 2 deployed successfully via Docker workflow!', { icon: '✅', style: { borderRadius: '10px', background: '#333', color: '#fff' } })} />
                    </div>
                </div>

                {/* P2P MODAL OVERLAY */}
                {p2pMode && (
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-md h-[85vh] bg-[#0a0f1e] rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col">
                            <button
                                onClick={() => setP2pMode(null)}
                                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition"
                            >
                                ✕
                            </button>
                            <div className="flex-1 overflow-y-auto">
                                <P2PDashboard initialMode={p2pMode} onClose={() => setP2pMode(null)} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-full text-center pb-8 opacity-50">
                    <div className="flex justify-center gap-4 mb-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <Server className="w-4 h-4 text-blue-500" />
                        <Lock className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">SECURED BY USA AFFILIATE BLOCKCHAIN</p>
                </div>

                {/* Daily Mystery Gift Box Overlay (Now triggered by Grid) */}
                <GiftBox user={user} onBalanceUpdate={fetchUser} />

                <AnimatePresence>
                    {connectingNode && (
                        <VPSConnectModal 
                            plan={connectingNode} 
                            onComplete={handleConnectComplete} 
                        />
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}

function FolderCard({ href, icon: Icon, label, color, gradient, border }) {
    return (
        <Link href={href} className={`p-4 rounded-2xl ${border} bg-white/5 backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 flex flex-col items-center gap-2 text-center aspect-square justify-center hover:bg-white/10 hover:shadow-lg`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/10 ${color} relative z-10 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.02)]`}>
                <Icon className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h4 className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors relative z-10 uppercase tracking-tight mt-1">{label}</h4>
        </Link>
    );
}
