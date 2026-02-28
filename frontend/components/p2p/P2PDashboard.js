'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Search, Filter, DollarSign, ArrowRight, ArrowLeft, User, ShieldCheck, Clock, Globe2, ArrowDownCircle, ArrowUpCircle, Zap, TrendingUp, BarChart2 } from 'lucide-react';
import OrderCreationModal from './OrderCreationModal';
import BuyOrderModal from './BuyOrderModal';
import P2PChatRoom from './P2PChatRoom';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import RatingModal from './RatingModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';
import { P2PSkeleton } from '../ui/SkeletonLoader';


export default function P2PDashboard({ initialMode, onClose }) {
    const { user } = useAuth();
    const userCountry = user?.country?.toUpperCase() || 'BD';
    const [mode, setMode] = useState(initialMode || 'buy'); // 'buy', 'sell', 'history', 'my_ads'

    // [NEW] Global Advanced Filters
    const [filters, setFilters] = useState({
        sort: '', // 'lowest', 'highest'
        country: 'all',
        paymentMethod: 'all'
    });

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTradeId, setActiveTradeId] = useState(null);
    const [ratingTradeId, setRatingTradeId] = useState(null);
    const [buyModalConfig, setBuyModalConfig] = useState({ isOpen: false, order: null });
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const router = useRouter(); // [FIX] Initialize hook here

    // [FIX] Use System Namespace to match Backend
    const socket = useSocket('/system');

    useEffect(() => {
        fetchOrders();

        if (socket) {
            socket.on('p2p_alert', () => {
                fetchOrders();
            });
            socket.on('p2p_completed', (trade) => {
                console.log("P2P Completed Event Received - Refreshing Orders");
                fetchOrders();
                // [NEW] Trigger Rating Modal
                setRatingTradeId(trade._id);
            });
            // [NEW] Real-time Push Notification for Seller when Buyer hits "Start Trade"
            socket.on('p2p_trade_start', (trade) => {
                // If I am the seller and a trade just started, show push notification
                if (trade.sellerId === user?._id) {
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-in slide-in-from-top-4 fade-in' : 'animate-out slide-out-to-top-4 fade-out'} max-w-sm w-full bg-emerald-900 border border-emerald-500 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                            <span className="text-xl">💰</span>
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-black text-white">New Trade Started!</p>
                                        <p className="mt-1 text-xs text-emerald-200 font-bold">A buyer wants to pay for {trade.amount} NXS. Please review the payment.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-emerald-500/30">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                        setActiveTradeId(trade._id); // Jump directly into chat
                                    }}
                                    className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-black text-emerald-300 hover:text-white hover:bg-emerald-800 transition focus:outline-none"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ), {
                        duration: 8000, // Stay on screen for 8s
                        position: 'top-center'
                    });

                    fetchOrders(); // Refresh background list
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('p2p_alert');
                socket.off('p2p_completed');
                socket.off('p2p_trade_start');
            }
        };
    }, [mode, filters, socket, user]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            if (mode === 'buy' || mode === 'sell') {
                // If Taker wants to BUY NXS -> Fetch SELL Ads. If Taker wants to SELL NXS -> Fetch BUY Ads.
                const targetAdType = mode === 'buy' ? 'SELL' : 'BUY';

                const query = new URLSearchParams({
                    type: targetAdType,
                    ...(filters.sort && { sort: filters.sort }),
                    ...(filters.country !== 'all' && { country: filters.country }),
                    ...(filters.paymentMethod !== 'all' && { paymentMethod: filters.paymentMethod })
                }).toString();

                const res = await api.get(`/p2p/market?${query}`);
                setOrders(res.data);
            } else if (mode === 'my_ads') {
                const res = await api.get('/p2p/my-orders');
                setOrders(res.data);
            } else if (mode === 'history') {
                const res = await api.get('/p2p/my-trades');
                setOrders(res.data);
            }
        } catch (e) {
            console.error(e);
            setOrders([]);
        }
        setLoading(false);
    };

    const handleTradeAction = (order) => {
        // [LIVE BALANCE CHECK] For SELL ads only
        if (order.type === 'SELL') {
            const liveAvailable = order.userId?.wallet?.main || 0;
            const maxLimit = Math.min(order.amount, liveAvailable);
            if (maxLimit <= 0) return toast.error("Seller has no balance available right now.");
        }

        setBuyModalConfig({ isOpen: true, order });
    };

    const confirmTrade = (requestedAmount) => {
        const order = buyModalConfig.order;
        const actionWord = order.type === 'SELL' ? 'buy' : 'sell';

        setBuyModalConfig({ isOpen: false, order: null });

        setModal({
            isOpen: true,
            title: `Confirm ${actionWord.toUpperCase()}`,
            message: `You are about to ${actionWord} ${requestedAmount} NXS. Proceed?`,
            confirmText: 'Confirm Trade',
            onConfirm: async () => {
                try {
                    const res = await api.post(`/p2p/buy/${order._id}`, { requestedAmount });
                    if (res.data.success) {
                        setActiveTradeId(res.data.trade._id);
                        localStorage.setItem('active_p2p_trade', res.data.trade._id);
                        toast.success("Trade Started Successfully!");
                    }
                } catch (e) {
                    toast.error(e.response?.data?.message || "Failed to start trade");
                }
            }
        });
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm("Are you sure you want to cancel this listing?")) return;
        try {
            const res = await api.post(`/p2p/sell/${orderId}/cancel`);
            if (res.data.success) {
                toast.success("Order Cancelled Successfully");
                fetchOrders();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to cancel order");
        }
    };

    useEffect(() => {
        const savedTrade = localStorage.getItem('active_p2p_trade');
        if (savedTrade) setActiveTradeId(savedTrade);
    }, []);

    // Clear on exit
    const exitTrade = () => {
        setActiveTradeId(null);
        localStorage.removeItem('active_p2p_trade');
    };

    const getMethodStyle = (method) => {
        const m = method.toLowerCase();
        if (m === 'bkash') return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
        if (m === 'nagad') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        if (m === 'binance' || m === 'binance pay') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        if (m === 'gpay' || m === 'google pay') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        return 'bg-[#1a2c3d] text-cyan-400 border-cyan-500/20';
    };

    const displayOrders = mode === 'buy'
        ? orders.filter(o => o.userId?.country?.toUpperCase() === userCountry)
        : orders;

    // If active trade, show Chat Room
    if (activeTradeId) {
        return <P2PChatRoom tradeId={activeTradeId} onBack={exitTrade} />;
    }

    // [NEW/PSYCHOLOGICAL] Calculate VIP Fee Tier
    const getFeeTier = (count) => {
        if (count >= 500) return { name: 'WHALE', fee: '0.07%', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' };
        if (count >= 250) return { name: 'EXPERT', fee: '0.25%', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' };
        if (count >= 100) return { name: 'PRO', fee: '0.50%', color: 'text-[#fcd535] bg-[#fcd535]/10 border-[#fcd535]/30' };
        if (count >= 20) return { name: 'TRADER', fee: '0.80%', color: 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/30' };
        return { name: 'NEWBIE', fee: '1.00%', color: 'text-[#848e9c] bg-[#2b3139]' };
    };
    const userTier = getFeeTier(user?.completedTrades || 0);

    return (
        <div className="min-h-screen bg-[#0b0e11] text-[#eaeaec] font-sans pb-24 overflow-x-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-[#181a20] border-b border-[#2b3139]">
                <div className="flex items-center gap-3">
                    <button onClick={onClose || (() => router.back())} className="text-[#848e9c] hover:text-[#eaeaec] transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-[#eaeaec] flex items-center gap-2">
                            P2P Market
                        </h1>
                        <p className="text-[10px] text-[#848e9c] font-bold uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#0ecb81]" /> Escrow Active
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchOrders} className="text-[#848e9c] hover:text-[#eaeaec] transition">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#fcd535]' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Trading View / Market Stats Header */}
            <div className="p-4 bg-[#181a20] border-b border-[#2b3139]">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-black text-[#eaeaec]">NXS / BDT</h2>
                            <span className="text-[10px] bg-[#2b3139] text-[#848e9c] px-2 py-0.5 rounded font-bold">P2P</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-[#0ecb81]">126.00</span>
                            <div className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 border ${userTier.color}`}>
                                <Zap className="w-3 h-3" /> {userTier.name} FEE: {userTier.fee}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 text-right">
                        <div>
                            <div className="text-[9px] text-[#848e9c] uppercase font-bold tracking-widest mb-0.5">24h High</div>
                            <div className="text-[11px] font-mono text-[#eaeaec]">128.50</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-[#848e9c] uppercase font-bold tracking-widest mb-0.5">24h Low</div>
                            <div className="text-[11px] font-mono text-[#eaeaec]">124.00</div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-[9px] text-[#848e9c] uppercase font-bold tracking-widest mb-0.5">24h Vol</div>
                            <div className="text-[11px] font-mono text-[#eaeaec]">84.5K</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sleek Tabs */}
            <div className="flex bg-[#181a20] px-3 overflow-x-auto scrollbar-none border-b border-[#2b3139]">
                {['buy', 'sell', 'my_ads', 'history'].map(t => (
                    <button
                        key={t}
                        onClick={() => setMode(t)}
                        className={`px-4 py-3 text-sm font-bold tracking-wide transition relative whitespace-nowrap ${mode === t ? (t === 'buy' ? 'text-[#0ecb81]' : t === 'sell' ? 'text-[#f6465d]' : 'text-[#fcd535]') : 'text-[#848e9c] hover:text-[#eaeaec]'}`}
                    >
                        {t === 'my_ads' ? 'MY ADS' : t.toUpperCase()}
                        {mode === t && (
                            <div className={`absolute bottom-0 left-0 w-full h-[2px] ${t === 'buy' ? 'bg-[#0ecb81]' : t === 'sell' ? 'bg-[#f6465d]' : 'bg-[#fcd535]'}`} />
                        )}
                    </button>
                ))}
            </div>

            {/* Post Ad Button (Moved inside My Ads) */}
            {mode === 'my_ads' && (
                <div className="px-4 py-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full py-3 bg-[#fcd535] hover:bg-[#e6c130] text-black rounded-lg font-black flex items-center justify-center gap-2 transition"
                    >
                        <Plus className="w-5 h-5" /> POST NEW AD
                    </button>
                </div>
            )}

            {/* Advanced Filters */}
            {(mode === 'buy' || mode === 'sell') && (
                <div className="p-3 bg-[#0b0e11]">
                    <div className="flex bg-[#181a20] rounded-lg p-1 border border-[#2b3139]">
                        <select
                            value={filters.country}
                            onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}
                            className="flex-1 bg-transparent text-[#eaeaec] text-xs font-bold px-2 py-2 outline-none border-r border-[#2b3139] appearance-none"
                        >
                            <option value="all">🌐 Any Country</option>
                            <option value="BD">🇧🇩 Bangladesh</option>
                            <option value="IN">🇮🇳 India</option>
                            <option value="GLOBAL">🌍 Global</option>
                        </select>
                        <select
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
                            className="flex-1 bg-transparent text-[#eaeaec] text-xs font-bold px-2 py-2 outline-none border-r border-[#2b3139] appearance-none"
                        >
                            <option value="all">All Payments</option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="binance">Binance</option>
                        </select>
                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                            className="flex-1 bg-transparent text-[#eaeaec] text-xs font-bold px-2 py-2 outline-none appearance-none"
                        >
                            <option value="">Sort: Best Rate</option>
                            <option value="lowest">Lowest Price</option>
                            <option value="highest">Highest Price</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Order List */}
            <div className="">
                {mode === 'history' ? (
                    loading ? <P2PSkeleton /> :
                        orders.length === 0 ? <div className="text-center py-10 text-[#848e9c]">No Trade History</div> :
                            orders.map(trade => (
                                <div key={trade._id} className="bg-[#181a20] mb-2 p-3 flex flex-col hover:bg-[#1e2329] transition group cursor-pointer" onClick={() => { setActiveTradeId(trade._id); localStorage.setItem('active_p2p_trade', trade._id); }}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${trade.status === 'COMPLETED' ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : trade.status === 'CANCELLED' ? 'bg-[#2b3139] text-[#848e9c]' : trade.status === 'DISPUTE' ? 'bg-[#f6465d]/10 text-[#f6465d]' : 'bg-[#fcd535]/10 text-[#fcd535]'}`}>
                                                {trade.status}
                                            </span>
                                            <span className="text-[10px] text-[#848e9c] font-mono">#{trade._id.substr(-6)}</span>
                                        </div>
                                        <div className="text-[10px] text-[#848e9c]">
                                            {new Date(trade.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm font-bold text-[#eaeaec] flex items-center gap-1">
                                                {trade.amount} NXS
                                            </div>
                                            <div className="text-[10px] text-[#848e9c] mt-0.5">
                                                {(trade.amount * (trade.orderId?.rate || 126)).toLocaleString('en-IN')} BDT
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2 text-[#848e9c] group-hover:text-[#eaeaec] transition">
                                            <span className="text-[10px] uppercase font-bold">{trade.orderId?.type === 'SELL' ? 'Bought' : 'Sold'}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))
                ) : (
                    /* Exchange Style Order Book View */
                    loading ? <P2PSkeleton /> :
                        orders.length === 0 ? <div className="text-center py-10 text-[#848e9c]">No Ads Match criteria</div> :
                            displayOrders.map(order => (
                                <div key={order._id} className="bg-[#181a20] mb-2 p-3 hover:bg-[#1e2329] transition relative">
                                    {/* Top Row: User Info */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-full bg-[#2b3139] flex items-center justify-center text-[10px] font-bold text-[#848e9c]">
                                            {order.userId?.username?.charAt(0) || 'U'}
                                        </div>
                                        <span className="font-bold text-sm text-[#eaeaec] truncate max-w-[120px]">
                                            {order.userId?.username || `User`}
                                        </span>
                                        {(order.userId?.isVerified || true) && <ShieldCheck className="w-3 h-3 text-[#fcd535]" />}
                                        <div className="flex gap-2 text-[10px] text-[#848e9c] ml-auto">
                                            <span>{order.userId?.completedTrades || 0} trades</span>
                                            <span>{order.userId?.trustScore || 100}%</span>
                                        </div>
                                    </div>

                                    {/* Middle Row: Price, Limits and Action */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-lg font-black font-mono text-[#eaeaec] leading-none">
                                                {order.rate || 126} <span className="text-[10px] text-[#848e9c] ml-0.5">BDT</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px]">
                                                <span className="text-[#848e9c] w-12 border-b border-dashed border-[#2b3139]">Amount</span>
                                                <span className="text-[#eaeaec] font-mono">{order.amount.toLocaleString()} NXS</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px]">
                                                <span className="text-[#848e9c] w-12 border-b border-dashed border-[#2b3139]">Limit</span>
                                                <span className="text-[#eaeaec] font-mono">100 - {((order.amount || 0) * (order.rate || 126)).toLocaleString('en-IN')} ৳</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-between h-full gap-2">
                                            {mode === 'my_ads' ? (
                                                <div className="text-right">
                                                    <div className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${order.status === 'OPEN' ? (order.type === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]') : 'text-[#848e9c]'}`}>
                                                        {order.type} • {order.status}
                                                    </div>
                                                    {order.status === 'OPEN' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCancelOrder(order._id); }}
                                                            className="text-[10px] text-[#f6465d] bg-[#f6465d]/10 hover:bg-[#f6465d]/20 font-bold px-4 py-1.5 rounded transition"
                                                        >
                                                            CANCEL
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleTradeAction(order)}
                                                    disabled={order.status !== 'OPEN'}
                                                    className={`px-6 py-2 rounded font-bold text-xs uppercase transition-all ${order.status !== 'OPEN' ? 'bg-[#2b3139] text-[#848e9c]' : (order.type === 'SELL' ? 'bg-[#0ecb81] hover:bg-[#0b9e65] text-black' : 'bg-[#f6465d] hover:bg-[#c93046] text-white')}`}
                                                >
                                                    {order.status !== 'OPEN' ? 'Taken' : (order.type === 'SELL' ? 'Buy' : 'Sell')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Row: Payments */}
                                    <div className="flex gap-1.5 items-center">
                                        <div className="w-1 h-3 rounded-full bg-[#fcd535]"></div>
                                        <span className="text-[10px] uppercase font-bold text-[#eaeaec]">{order.paymentMethod}</span>
                                    </div>
                                </div>
                            ))
                )}
            </div>

            {/* Modals */}
            {showCreateModal && <OrderCreationModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchOrders(); }} />}
            <BuyOrderModal isOpen={buyModalConfig.isOpen} onClose={() => setBuyModalConfig({ isOpen: false, order: null })} order={buyModalConfig.order} onConfirm={confirmTrade} />
            {ratingTradeId && <RatingModal tradeId={ratingTradeId} onClose={() => setRatingTradeId(null)} onSuccess={() => setRatingTradeId(null)} />}
            <ConfirmationModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} confirmText={modal.confirmText || 'Confirm'} />
        </div>
    );
}
