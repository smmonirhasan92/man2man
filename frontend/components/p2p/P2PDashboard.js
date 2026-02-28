'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Search, Filter, DollarSign, ArrowRight, ArrowLeft, User, ShieldCheck, Clock, Globe2 } from 'lucide-react';
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

    const displayOrders = mode === 'buy' && !globalMode
        ? orders.filter(o => o.userId?.country?.toUpperCase() === userCountry)
        : orders;

    // If active trade, show Chat Room
    if (activeTradeId) {
        return <P2PChatRoom tradeId={activeTradeId} onBack={exitTrade} />;
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white p-4 pb-24 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pt-4">
                <div className="flex items-center gap-3">
                    <button onClick={onClose || (() => router.back())} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition border border-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-wide">P2P TRADING</h1>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Secure Escrow
                        </p>
                    </div>
                </div>
                <button onClick={fetchOrders} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition border border-white/5">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                </button>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-[#111] p-1 rounded-xl mb-4 border border-white/10 gap-1">
                <button
                    onClick={() => setMode('buy')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'buy' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <ArrowDownCircle className="w-4 h-4" /> Buy NXS
                </button>
                <button
                    onClick={() => setMode('sell')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'sell' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <ArrowUpCircle className="w-4 h-4" /> Sell NXS
                </button>
                <button
                    onClick={() => setMode('my_ads')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'my_ads' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <User className="w-4 h-4" /> My Ads
                </button>
                <button
                    onClick={() => setMode('history')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'history' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    <Clock className="w-4 h-4" /> History
                </button>
            </div>

            {/* Content Area */}
            {
                (mode === 'buy' || mode === 'sell' || mode === 'my_ads') && (
                    <div className="mb-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition"
                        >
                            <Plus className="w-5 h-5" /> Post New Ad
                        </button>
                    </div>
                )
            }

            {/* Advanced Filters */}
            {(mode === 'buy' || mode === 'sell') && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                    <select
                        value={filters.country}
                        onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}
                        className="bg-[#111927] border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
                    >
                        <option value="all">🌐 Any Country</option>
                        <option value="BD">🇧🇩 Bangladesh</option>
                        <option value="IN">🇮🇳 India</option>
                        <option value="GLOBAL">🌍 Global (Binance)</option>
                    </select>

                    <select
                        value={filters.sort}
                        onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                        className="bg-[#111927] border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
                    >
                        <option value="">Sort: Best Rate</option>
                        <option value="lowest">Lowest Price</option>
                        <option value="highest">Highest Price</option>
                    </select>

                    <select
                        value={filters.paymentMethod}
                        onChange={(e) => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
                        className="bg-[#111927] border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
                    >
                        <option value="all">All Payments</option>
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                        <option value="binance">Binance</option>
                        <option value="bank">Bank</option>
                    </select>
                </div>
            )}

            {/* Order List */}
            <div className="space-y-3">
                {/* [NEW] History Layout */}
                {mode === 'history' ? (
                    loading ? <P2PSkeleton /> :
                        orders.length === 0 ? <div className="text-center py-10 opacity-30">No Trade History</div> :
                            orders.map(trade => (
                                <div key={trade._id} className="bg-[#161b2e] border border-white/5 p-4 rounded-xl flex justify-between items-center opacity-80 hover:opacity-100 transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${trade.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : trade.status === 'CANCELLED' ? 'bg-slate-700 text-slate-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                {trade.status}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">#{trade._id.substr(-6)}</span>
                                        </div>
                                        <div className="text-lg font-bold text-white flex items-center gap-2">
                                            {trade.amount} NXS
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                                            TxID: {trade.txId || '---'} | Sender: {trade.senderNumber || '---'}
                                        </div>
                                    </div>
                                    <button onClick={() => { setActiveTradeId(trade._id); localStorage.setItem('active_p2p_trade', trade._id); }} className="p-2 hover:bg-white/10 rounded-full">
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            ))
                ) : (
                    /* Existing Order List */
                    loading ? <P2PSkeleton /> :
                        orders.length === 0 ? <div className="text-center py-10 opacity-30">No Active Ads matching filters</div> :
                            orders.map(order => (
                                <div key={order._id} className="bg-[#111927] border border-white/5 p-4 rounded-xl flex justify-between items-center group relative overflow-hidden shadow-lg mb-3">

                                    {/* Verified Background Glow */}
                                    {order.userId?.isVerified && <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none"></div>}

                                    <div className="relative z-10">
                                        {/* User Info */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/10">
                                                {order.userId?.username?.charAt(0) || 'U'}
                                            </div>
                                            <span className="font-bold text-sm text-slate-200 flex items-baseline gap-1">
                                                {order.userId?.username || `User ${order.userId?._id?.substr(-4)}`}
                                                {(order.userId?.isVerified || true) && (
                                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 translate-y-0.5" />
                                                )}
                                            </span>
                                            {order.isInstant && (
                                                <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-widest flex items-center gap-0.5">
                                                    <Zap className="w-3 h-3" /> INSTANT
                                                </span>
                                            )}
                                        </div>

                                        {/* Price Display */}
                                        <div className="text-2xl font-black text-white leading-none">
                                            {order.amount.toLocaleString()} <span className="text-xs font-bold text-slate-500">NXS</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                            Rate: <span className="text-emerald-400">1 NXS = {order.rate || 126} BDT</span>
                                        </div>

                                        {/* Limits & Methods */}
                                        <div className="flex gap-2 mt-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getMethodStyle(order.paymentMethod)}`}>{order.paymentMethod}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="relative z-10 flex flex-col items-end gap-2">
                                        {mode === 'my_ads' ? (
                                            <div className="text-right">
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${order.status === 'OPEN' ? (order.type === 'BUY' ? 'text-blue-400' : 'text-emerald-400') : 'text-yellow-500'}`}>
                                                    {order.type} AD • {order.status}
                                                </div>
                                                {order.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 border border-red-500/20 rounded-md bg-red-500/10"
                                                    >
                                                        CANCEL
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleTradeAction(order)}
                                                disabled={order.status !== 'OPEN'}
                                                className={`h-10 px-6 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${order.status !== 'OPEN' ? 'bg-slate-800 text-slate-500' : (order.type === 'SELL' ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20')}`}
                                            >
                                                {order.status !== 'OPEN' ? 'Taken' : (order.type === 'SELL' ? 'BUY NXS' : 'SELL NXS')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                )}
            </div>

            {/* Modals */}
            {
                showCreateModal && (
                    <OrderCreationModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchOrders(); }} />
                )
            }

            <BuyOrderModal
                isOpen={buyModalConfig.isOpen}
                onClose={() => setBuyModalConfig({ isOpen: false, order: null })}
                order={buyModalConfig.order}
                onConfirm={confirmBuy}
            />

            {/* Rating Modal */}
            {
                ratingTradeId && (
                    <RatingModal
                        tradeId={ratingTradeId}
                        onClose={() => setRatingTradeId(null)}
                        onSuccess={() => setRatingTradeId(null)}
                    />
                )
            }
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText || 'Confirm'}
            />
        </div >
    );
}
