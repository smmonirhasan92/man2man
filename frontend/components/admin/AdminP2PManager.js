'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, FileText, Ban } from 'lucide-react';
import USCIcon from '../ui/USCIcon';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';

export default function AdminP2PManager() {
    const [orders, setOrders] = useState([]);
    const [trades, setTrades] = useState([]);
    const [commissions, setCommissions] = useState([]); // [REVENUE TRACKING]
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [securityModal, setSecurityModal] = useState({ isOpen: false, tradeId: null });
    const [secKeys, setSecKeys] = useState(['', '', '']);

    useEffect(() => {
        fetchMarket();
    }, []);

    const fetchMarket = async () => {
        try {
            // Fetch Open Orders
            const orderRes = await api.get('/p2p/market');
            setOrders(orderRes.data);

            // Fetch Active/Pending Trades
            const tradeRes = await api.get('/p2p/admin/trades');
            setTrades(tradeRes.data);

            // Fetch Commissions (Simulated for now by filtering trades, ideally separate endpoint)
            const completedTrades = tradeRes.data.filter(t => t.status === 'COMPLETED');
            setCommissions(completedTrades);
        } catch (e) {
            console.error(e);
        }
    };

    const approve = async (tradeId) => {
        setSecKeys(['', '', '']);
        setSecurityModal({ isOpen: true, tradeId });
    };

    const submitSecureApprove = async () => {
        try {
            await api.post('/p2p/admin/approve', {
                tradeId: securityModal.tradeId,
                secKey1: secKeys[0],
                secKey2: secKeys[1],
                secKey3: secKeys[2]
            });
            toast.success("Approved & Released Securely!");
            fetchMarket();
            setSecurityModal({ isOpen: false, tradeId: null });
        } catch (e) {
            toast.error(e.response?.data?.message || "Security Verification Failed");
        }
    };

    const resolve = async (tradeId, resolution) => {
        const action = resolution === 'REFUND_TO_SELLER' ? 'REJECT & REFUND' : 'FORCE RELEASE';
        setModal({
            isOpen: true,
            title: `Confirm ${action}?`,
            message: 'This cannot be undone. Funds will be moved immediately.',
            confirmText: action,
            onConfirm: async () => {
                try {
                    await api.post('/p2p/admin/resolve', { tradeId, resolution });
                    toast.success("Processed Successfully");
                    fetchMarket();
                } catch (e) {
                    toast.error(e.response?.data?.message || "Failed");
                }
            }
        });
    };

    return (
        <div className="bg-[#111] p-6 rounded-xl border border-white/10 space-y-8">
            <h2 className="text-xl font-bold text-white flex justify-between">
                <span>P2P Oversight</span>
                <button onClick={fetchMarket}><RefreshCw className="w-4 h-4" /></button>
            </h2>

            {/* 1. PENDING APPROVALS */}
            <div className="bg-orange-900/10 border border-orange-500/20 p-4 rounded-xl">
                <h3 className="text-orange-500 font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Action Required (Awaiting Admin)
                </h3>
                {trades.filter(t => t.status === 'AWAITING_ADMIN').length === 0 ? <div className="text-slate-500 text-sm">No pending approvals.</div> : (
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-black/20 text-xs font-bold text-slate-300">
                            <tr>
                                <th className="p-3">Seller</th>
                                <th className="p-3">Buyer</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Proof</th>
                                <th className="p-3">Profit (2%)</th>
                                <th className="p-3 text-right">Decide</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.filter(t => t.status === 'AWAITING_ADMIN').map(t => (
                                <tr key={t._id} className="border-b border-white/5 hover:bg-white/5 transition">
                                    <td className="p-3">{t.sellerId?.username}</td>
                                    <td className="p-3">{t.buyerId?.username}</td>
                                    <td className="p-3 font-mono text-white flex items-center gap-1"><USCIcon className="w-3 h-3" /> {t.amount}</td>
                                    <td className="p-3">
                                        {t.paymentProofUrl ? (
                                            <a href={t.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs underline">
                                                <Eye className="w-3 h-3" /> View Receipt
                                            </a>
                                        ) : <span className="text-red-500 text-xs">Missing</span>}
                                    </td>
                                    <td className="p-3 font-mono text-emerald-500 flex items-center gap-1"><USCIcon className="w-3 h-3" /> {(t.amount * 0.02).toFixed(2)}</td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        <button onClick={() => resolve(t._id, 'REFUND_TO_SELLER')} className="bg-red-900/40 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition border border-red-500/20 flex items-center gap-1">
                                            <Ban className="w-3 h-3" /> Reject
                                        </button>
                                        <button onClick={() => approve(t._id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg shadow-emerald-900/20 transition flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 2. OPEN ORDERS */}
            <div>
                <h3 className="text-white font-bold mb-3">Open Market Orders</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 uppercase text-xs font-bold text-slate-300">
                            <tr>
                                <th className="p-3">User</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.map(o => (
                                <tr key={o._id} className="hover:bg-white/5">
                                    <td className="p-3">{o.userId.username}</td>
                                    <td className="p-3 font-mono text-white flex items-center gap-1"><USCIcon className="w-3 h-3" /> {o.amount}</td>
                                    <td className="p-3 uppercase text-[10px]">{o.paymentMethod}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] ${o.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'}`}>{o.status}</span></td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        {o.status === 'OPEN' && (
                                            <button className="text-[10px] bg-red-900/40 text-red-400 px-2 py-1 rounded border border-red-500/30 hover:bg-red-500 hover:text-white transition">Cancel Order</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. REVENUE TRACKING */}
            <div className="bg-emerald-900/5 border border-emerald-500/10 p-4 rounded-xl">
                <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Commission History (2% Fees)
                </h3>
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-black/20 text-xs font-bold text-slate-300">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Trade ID</th>
                            <th className="p-2">Total Volume</th>
                            <th className="p-2">Commission Earned</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commissions.length === 0 ? <tr><td colSpan="4" className="p-4 text-center text-xs opacity-50">No fees collected yet.</td></tr> : commissions.slice(0, 10).map(c => (
                            <tr key={c._id} className="border-b border-white/5 hover:bg-emerald-500/5">
                                <td className="p-2 text-xs">{new Date(c.completedAt).toLocaleDateString()}</td>
                                <td className="p-2 font-mono text-xs opacity-50">{c._id.substr(-6)}</td>
                                <td className="p-2 font-mono"><span className="flex items-center gap-1"><USCIcon className="w-3 h-3" /> {c.amount}</span></td>
                                <td className="p-2 font-mono text-emerald-400 font-bold"><span className="flex items-center gap-1"><USCIcon className="w-3 h-3" /> {c.fee?.toFixed(2)}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Modal */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText || 'Confirm'}
            />

            {/* 3-Layer Security Modal */}
            {securityModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSecurityModal({ isOpen: false })}></div>
                    <div className="relative bg-[#0a0f1e] border-2 border-red-500/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                <span className="text-2xl text-red-500 font-black">!</span>
                            </div>
                            <h2 className="text-red-500 font-black text-xl uppercase tracking-widest">Security Check</h2>
                            <p className="text-xs text-slate-400 mt-2">Enter your 3 Secret Keys to authorize this P2P Release.</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {[0, 1, 2].map((i) => (
                                <input
                                    key={i}
                                    type="password"
                                    placeholder={`Secret Key ${i + 1}`}
                                    value={secKeys[i]}
                                    onChange={(e) => {
                                        const newKeys = [...secKeys];
                                        newKeys[i] = e.target.value;
                                        setSecKeys(newKeys);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] focus:outline-none focus:border-red-500 transition-colors"
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setSecurityModal({ isOpen: false })} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition">
                                CANCEL
                            </button>
                            <button
                                onClick={submitSecureApprove}
                                disabled={secKeys.some(k => !k)}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                AUTHORIZE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
