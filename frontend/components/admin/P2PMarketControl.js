'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Trash2, ArrowUpDown, Filter, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function P2PMarketControl() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    // Filters
    const [typeFilter, setTypeFilter] = useState(''); // '' = All, 'BUY', 'SELL'
    const [sortFilter, setSortFilter] = useState(''); // '' = Newest, 'highest', 'lowest'

    useEffect(() => {
        fetchOrders();
    }, [typeFilter, sortFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = '/p2p/admin/orders?';
            if (typeFilter) query += `type=${typeFilter}&`;
            if (sortFilter) query += `sort=${sortFilter}`;

            const res = await api.get(query);
            setOrders(res.data);
        } catch (e) {
            toast.error("Failed to load active orders");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (orderId) => {
        setConfirmModal({
            isOpen: true,
            title: 'FORCE DELETE POST',
            message: 'Are you sure you want to forcibly delete this P2P advertisement? If it is a SELL ad, the reserved NXS amount will not be locked, it will just drop the listing.',
            confirmText: 'Delete Listing',
            onConfirm: async () => {
                try {
                    await api.delete(`/p2p/admin/orders/${orderId}`);
                    toast.success("Post successfully deleted and removed from market.");
                    fetchOrders();
                    setConfirmModal({ isOpen: false });
                } catch (e) {
                    toast.error(e.response?.data?.message || "Deletion failed");
                }
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden font-sans">
            {/* Header / Actions */}
            <div className="p-4 border-b border-white/10 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-red-500 font-bold">
                    <ShieldAlert className="w-5 h-5" /> Live Market Scanner ({orders.length})
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-black border border-white/20 text-white text-xs rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="">All Types (Buy & Sell)</option>
                        <option value="SELL">SELL Ads (NXS to BDT)</option>
                        <option value="BUY">BUY Ads (BDT to NXS)</option>
                    </select>

                    <select
                        value={sortFilter}
                        onChange={(e) => setSortFilter(e.target.value)}
                        className="bg-black border border-white/20 text-white text-xs rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="">Sort: Newest First</option>
                        <option value="highest">Sort: Highest Rate</option>
                        <option value="lowest">Sort: Lowest Rate</option>
                    </select>

                    <button onClick={fetchOrders} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {orders.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">No active orders found.</div>
                )}
                {orders.map(o => (
                    <div key={o._id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/10 transition">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`text-[10px] sm:text-xs font-black px-2 py-1 rounded w-14 text-center ${o.type === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {o.type}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white mb-0.5">{o.userId?.username || 'Unknown'} <span className="text-[10px] text-slate-500 font-normal ml-1">({o.userId?.country || 'BD'})</span></div>
                                <div className="text-[10px] text-slate-400 font-mono">Limit: {o.amount} NXS via {o.paymentMethod}</div>
                            </div>
                        </div>

                        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 border-t border-white/10 sm:border-0 pt-3 sm:pt-0">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Exchange Rate</div>
                                <div className={`text-lg font-black font-mono flex items-center gap-1 ${(o.rate > 135 || o.rate < 110) ? 'text-red-500' : 'text-fuchsia-400'}`}>
                                    {o.rate} <span className="text-[10px] font-sans">BDT</span>
                                </div>
                            </div>

                            <button onClick={() => handleDelete(o._id)} className="p-3 bg-red-900/40 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition border border-red-500/30">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText || 'Confirm'}
            />
        </div>
    );
}
