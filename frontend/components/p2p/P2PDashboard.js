'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Search, Filter, DollarSign, ArrowRight, ArrowLeft, User, ShieldCheck, Clock } from 'lucide-react';
import OrderCreationModal from './OrderCreationModal';
import P2PChatRoom from './P2PChatRoom';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import RatingModal from './RatingModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';
import { P2PSkeleton } from '../ui/SkeletonLoader';


export default function P2PDashboard({ initialMode, onClose }) {
    const [mode, setMode] = useState(initialMode || 'buy');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTradeId, setActiveTradeId] = useState(null);
    const [ratingTradeId, setRatingTradeId] = useState(null); // State for rating
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
        }

        return () => {
            if (socket) {
                socket.off('p2p_alert');
                socket.off('p2p_completed');
            }
        };
    }, [mode, socket]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            if (mode === 'buy') {
                // Get MARKET (Others' Sell Orders)
                const res = await api.get('/p2p/market');
                setOrders(res.data);
            } else if (mode === 'sell') {
                // Get MY ORDERS (Sell Offers)
                const res = await api.get('/p2p/my-orders');
                setOrders(res.data);
            } else if (mode === 'history') {
                // [NEW] Get MY COMPLETE TRADE HISTORY
                const res = await api.get('/p2p/my-trades');
                setOrders(res.data);
            }
        } catch (e) {
            console.error(e);
            setOrders([]); // [FIX] Show empty on error
        }
        setLoading(false);
    };

    const handleBuy = async (order) => {
        // [LIVE BALANCE SYSTEM]
        // order.userId.wallet.main is the live balance available
        // order.amount is the maximum limit set by seller
        const liveAvailable = order.userId?.wallet?.main || 0;
        const maxLimit = Math.min(order.amount, liveAvailable); // Can't buy more than what's available

        if (maxLimit <= 0) {
            return toast.error("Seller has no balance available right now.");
        }

        const requestedString = window.prompt(`Seller's Live Balance: ${liveAvailable} NXS\nMax Limit: ${order.amount} NXS\nExchange Rate: 1 NXS = ${order.rate || 126} BDT\n\nEnter amount of NXS you want to buy (Max: ${maxLimit}):`);

        if (!requestedString) return; // Cancelled
        const requestedAmount = Number(requestedString);

        if (isNaN(requestedAmount) || requestedAmount <= 0) {
            return toast.error("Invalid amount");
        }
        if (requestedAmount > maxLimit) {
            return toast.error(`Amount exceeds maximum available limit of ${maxLimit} NXS`);
        }

        setModal({
            isOpen: true,
            title: 'Initiate Trade?',
            message: `You are about to buy ${requestedAmount} NXS. The funds will be locked in escrow. Proceed?`,
            confirmText: 'Start Trade',
            onConfirm: async () => {
                try {
                    const res = await api.post(`/p2p/buy/${order._id}`, { requestedAmount });
                    if (res.data.success) {
                        setActiveTradeId(res.data.trade._id);
                        localStorage.setItem('active_p2p_trade', res.data.trade._id); // Persist
                        toast.success("Trade Started! Funds Locked in Escrow.");
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
            <div className="flex bg-[#111] p-1 rounded-xl mb-6 border border-white/10 gap-1">
                <button
                    onClick={() => setMode('buy')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'buy' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <ArrowRight className="w-4 h-4 rotate-45" /> Buy
                </button>
                <button
                    onClick={() => setMode('sell')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'sell' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <DollarSign className="w-4 h-4" /> Sell
                </button>
                <button
                    onClick={() => setMode('history')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-500 hover:text-white'}`}
                >
                    <Clock className="w-4 h-4" /> History
                </button>
            </div>

            {/* Content Area */}
            {
                mode === 'sell' && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition"
                        >
                            <Plus className="w-5 h-5" /> Create Sell Order
                        </button>
                    </div>
                )
            }

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
                        orders.length === 0 ? <div className="text-center py-10 opacity-30">No Active Orders</div> :
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
                                            <span className="font-bold text-sm text-slate-200 flex items-center gap-1">
                                                {order.userId?.username || `User ${order.userId?._id?.substr(-4)}`}
                                                {/* Always show Verified for now to match request for Trust Aesthetics, or strictly if logic exists */}
                                                {(order.userId?.isVerified || true) && (
                                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                                                )}
                                            </span>
                                            <span className="text-[10px] text-slate-500">• {order.completedTrades || '98%'} Rate</span>
                                        </div>

                                        {/* Price Display */}
                                        <div className="text-2xl font-black text-white leading-none">
                                            {Math.min(order.amount, order.userId?.wallet?.main || 0).toLocaleString()} <span className="text-xs font-bold text-slate-500">NXS</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                            Rate: <span className="text-emerald-400">1 NXS = {order.rate || 126} BDT</span>
                                        </div>

                                        {/* Limits & Methods */}
                                        <div className="flex gap-2 mt-3">
                                            <span className="text-[10px] px-2 py-0.5 bg-[#1a2c3d] text-cyan-400 border border-cyan-500/20 rounded font-bold uppercase tracking-wider">{order.paymentMethod}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="relative z-10 flex flex-col items-end gap-2">
                                        {mode === 'buy' ? (
                                            <button
                                                onClick={() => handleBuy(order)}
                                                disabled={order.status !== 'OPEN'}
                                                className={`h-10 px-6 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${order.status !== 'OPEN' ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'}`}
                                            >
                                                {order.status !== 'OPEN' ? 'Taken' : 'BUY'}
                                            </button>
                                        ) : (
                                            <div className="text-right">
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${order.status === 'OPEN' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                                                    {order.status}
                                                </div>
                                                {order.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        className="text-[10px] text-red-500 hover:text-red-400 font-bold px-2 py-1 border border-red-500/20 rounded-md bg-red-500/10"
                                                    >
                                                        CANCEL
                                                    </button>
                                                )}
                                                {order.status === 'LOCKED' && order.activeTradeId && (
                                                    <button
                                                        onClick={() => {
                                                            setActiveTradeId(order.activeTradeId);
                                                            localStorage.setItem('active_p2p_trade', order.activeTradeId);
                                                        }}
                                                        className="text-[10px] bg-cyan-600 px-3 py-1.5 rounded text-white font-bold shadow-lg shadow-cyan-600/20"
                                                    >
                                                        CHAT
                                                    </button>
                                                )}
                                            </div>
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
