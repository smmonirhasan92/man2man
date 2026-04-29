import React from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TransactionCard({
    trx,
    index,
    agents,
    onApprove,
    onReject,
    onRefresh
}) {
    const [adminMsg, setAdminMsg] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Parse recipientDetails → method, type, number
    const parseDetails = () => {
        if (!trx.recipientDetails) return { method: '', accountType: '', number: '' };
        const parts = trx.recipientDetails.split(' - ');
        if (parts.length >= 3) {
            return { method: parts[0]?.trim(), accountType: parts[1]?.trim(), number: parts[2]?.split('(')[0]?.trim() };
        }
        return { method: parts[0]?.trim() || '', accountType: '', number: parts[1]?.split('(')[0]?.trim() || '' };
    };
    const { method, accountType, number } = parseDetails();
    const isBkash = method?.toLowerCase().includes('bkash');
    const isAgent = accountType?.toLowerCase().includes('agent');
    const isCashOut = trx.type === 'cash_out' || trx.type === 'withdraw';

    const doCopy = (text) => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text); toast.success('Copied!');
        } else {
            const el = document.createElement('textarea');
            el.value = text; document.body.appendChild(el); el.select();
            try { document.execCommand('copy'); toast.success('Copied!'); } catch {}
            document.body.removeChild(el);
        }
    };

    const handleSendInstructions = async () => {
        if (!adminMsg) return toast.error('Enter a number first');
        setLoading(true);
        try {
            await api.post('/transactions/provide-instructions', { transactionId: trx._id, adminInstructions: adminMsg });
            toast.success('Sent!'); if (onRefresh) onRefresh();
        } catch { toast.error('Failed'); } finally { setLoading(false); }
    };

    const statusConfig = {
        pending:              { label: 'Pending',           color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        pending_instructions: { label: 'Needs Number',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        awaiting_payment:     { label: 'Awaiting Payment',  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
        final_review:         { label: 'Final Review',      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse' },
        completed:            { label: 'Completed',         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        rejected:             { label: 'Rejected',          color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    };
    const { label: statusLabel, color: statusColor } = statusConfig[trx.status] || statusConfig.pending;

    return (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* ── TOP BAR: serial + status ── */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {index + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {isCashOut ? '📤 Cash-out Request' : '📥 Deposit Request'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusColor}`}>
                        {statusLabel}
                    </span>
                    <span className="text-[9px] text-slate-400">
                        {new Date(trx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* ── MAIN BODY ── */}
            <div className="px-4 py-3 grid grid-cols-3 gap-4 items-center">
                {/* User info */}
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">User</p>
                    <p className="text-sm font-black text-slate-800 truncate">{trx.userId?.fullName || 'Unknown'}</p>
                    <p className="text-[9px] text-slate-400 font-mono">@{trx.userId?.username || '—'}</p>
                </div>

                {/* Amount */}
                <div className="text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Amount</p>
                    <p className="text-xl font-black text-slate-800 tabular-nums">
                        {Math.abs(trx.amount)?.toLocaleString()}
                        <span className="text-xs font-bold text-slate-400 ml-1">NXS</span>
                    </p>
                    <p className="text-[9px] text-slate-400">
                        ≈ {(Math.abs(trx.amount) * 1.23).toFixed(2)} BDT
                    </p>
                </div>

                {/* Payment Number */}
                <div className="text-right">
                    {number ? (
                        <>
                            <div className="flex items-center justify-end gap-1 mb-0.5">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isBkash ? 'bg-pink-100 text-pink-600' : 'bg-orange-100 text-orange-600'}`}>{method}</span>
                                {accountType && (
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isAgent ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'}`}>
                                        {isAgent ? 'Agent' : 'Personal'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => doCopy(number)}
                                className="text-base font-black text-slate-800 hover:text-blue-600 transition-colors tabular-nums tracking-wider"
                                title="Click to copy"
                            >
                                {number}
                            </button>
                            <p className="text-[8px] text-slate-400 mt-0.5">{isAgent ? 'Cash Out' : 'Send Money'} · tap to copy</p>
                        </>
                    ) : (
                        <p className="text-xs text-slate-300 italic">No number</p>
                    )}
                </div>
            </div>

            {/* ── EXTRA: pending_instructions input ── */}
            {trx.status === 'pending_instructions' && (
                <div className="px-4 pb-3 flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter payment number for user..."
                        value={adminMsg}
                        onChange={e => setAdminMsg(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold outline-none focus:border-blue-400"
                    />
                    <button
                        onClick={handleSendInstructions}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg font-black text-[9px] uppercase"
                    >
                        {loading ? '...' : 'Send'}
                    </button>
                </div>
            )}

            {/* ── FINAL REVIEW TxID ── */}
            {trx.status === 'final_review' && trx.proofTxID && (
                <div className="px-4 pb-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                            <p className="text-[8px] font-black text-blue-500 uppercase mb-0.5">Payment TxID</p>
                            <p className="text-sm font-black text-slate-800 font-mono">{trx.proofTxID}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ACTION ROW ── */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[8px] text-slate-400 font-mono flex-1">
                    REF #{trx._id?.slice(-8).toUpperCase()}
                </span>
                {['pending', 'final_review'].includes(trx.status) && (
                    <button
                        onClick={() => onApprove(trx)}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-colors shadow-sm"
                    >
                        {isCashOut ? '✓ Approve' : '✓ Credit'}
                    </button>
                )}
                {['pending', 'pending_instructions'].includes(trx.status) && (
                    <button
                        onClick={() => onReject(trx)}
                        className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg font-black text-[9px] uppercase tracking-wider transition-colors"
                    >
                        Reject
                    </button>
                )}
            </div>
        </div>
    );
}
