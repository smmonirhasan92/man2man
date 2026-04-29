import React from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TransactionCard({
    trx,
    index,
    agents,
    selectedAgentId,
    onSelectAgent,
    onAssign,
    onApprove,
    onReject,
    onView,
    onRefresh
}) {
    const [adminMsg, setAdminMsg] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);

    const handleProvideInstructions = async () => {
        if (!adminMsg) return toast.error('Please enter a number');
        setLoading(true);
        try {
            await api.post('/transactions/provide-instructions', {
                transactionId: trx._id,
                adminInstructions: adminMsg
            });
            toast.success('Number sent to user!');
            if (onRefresh) onRefresh();
        } catch (e) { toast.error('Failed to send'); }
        finally { setLoading(false); }
    };

    // Parse recipientDetails
    const parseDetails = () => {
        if (!trx.recipientDetails) return { method: '', accountType: '', number: '' };
        const parts = trx.recipientDetails.split(' - ');
        if (parts.length >= 3) {
            return {
                method: parts[0]?.trim(),
                accountType: parts[1]?.trim(),
                number: parts[2]?.split('(')[0]?.trim()
            };
        }
        return {
            method: parts[0]?.trim() || '',
            accountType: '',
            number: parts[1]?.split('(')[0]?.trim() || ''
        };
    };

    const { method, accountType, number } = parseDetails();
    const isBkash = method?.toLowerCase().includes('bkash');
    const isAgent = accountType?.toLowerCase().includes('agent');
    const isCashOut = trx.type === 'cash_out' || trx.type === 'withdraw';

    const doCopy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
            toast.success('Copied!');
        } else {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            try { document.execCommand('copy'); toast.success('Copied!'); }
            catch { toast.error('Could not copy'); }
            document.body.removeChild(el);
        }
    };

    const statusColors = {
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        pending_instructions: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        awaiting_payment: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        final_review: 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    const statusClass = statusColors[trx.status] || statusColors.pending;

    return (
        <div className={`bg-[#111111] border rounded-2xl overflow-hidden transition-all duration-300 ${expanded ? 'border-[#D4AF37]/40' : 'border-white/5 hover:border-white/10'}`}>
            {/* ── COMPACT HEADER ROW ── */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Index Badge */}
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-slate-400">#{index + 1}</span>
                </div>

                {/* Type icon */}
                <span className="text-lg flex-shrink-0">{isCashOut ? '📤' : '📥'}</span>

                {/* User + Number */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white truncate">
                            {trx.userId?.fullName || 'Unknown'}
                        </p>
                        <span className="text-[9px] text-slate-600 font-mono flex-shrink-0">
                            @{trx.userId?.username || '—'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm font-black text-[#D4AF37] tabular-nums">
                            {Math.abs(trx.amount)?.toLocaleString()} NXS
                        </p>
                        {number && (
                            <button
                                onClick={(e) => { e.stopPropagation(); doCopy(number); }}
                                className={`text-[9px] font-black px-2 py-0.5 rounded border ${isBkash ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}
                            >
                                {number} 📋
                            </button>
                        )}
                    </div>
                </div>

                {/* Status + time */}
                <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border block mb-1 ${statusClass}`}>
                        {trx.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[8px] text-slate-600">
                        {new Date(trx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Expand arrow */}
                <span className={`text-slate-600 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
            </div>

            {/* ── EXPANDED DETAIL PANEL ── */}
            {expanded && (
                <div className="border-t border-white/5 px-4 py-4 space-y-4">

                    {/* Payment Details Box */}
                    {number && (
                        <div
                            onClick={() => doCopy(number)}
                            className="cursor-pointer bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-3 flex items-center justify-between group hover:border-[#D4AF37]/40 transition-colors"
                        >
                            <div>
                                <div className="flex gap-2 mb-1">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isBkash ? 'bg-pink-500/20 text-pink-400' : 'bg-orange-500/20 text-orange-400'}`}>{method}</span>
                                    {accountType && (
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isAgent ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {isAgent ? 'Cash Out (Agent)' : 'Send Money'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xl font-black text-white tracking-wider">{number}</p>
                            </div>
                            <span className="text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors text-lg">📋</span>
                        </div>
                    )}

                    {/* Pending Instructions input */}
                    {trx.status === 'pending_instructions' && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Bkash/Nagad Number..."
                                value={adminMsg}
                                onChange={(e) => setAdminMsg(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]/50"
                            />
                            <button
                                disabled={loading}
                                onClick={handleProvideInstructions}
                                className="px-4 py-2.5 bg-[#D4AF37] text-black rounded-xl font-black text-[9px] uppercase"
                            >
                                {loading ? '...' : 'SEND'}
                            </button>
                        </div>
                    )}

                    {/* Final Review TxID */}
                    {trx.status === 'final_review' && trx.proofTxID && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">Payment TxID</p>
                                <p className="text-sm font-black text-white font-mono">{trx.proofTxID}</p>
                            </div>
                        </div>
                    )}

                    {/* Ref + Timestamp */}
                    <div className="flex gap-4 text-[8px] font-bold text-slate-600 uppercase">
                        <span>REF: {trx._id?.slice(-8)}</span>
                        <span>{new Date(trx.createdAt).toLocaleString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {['pending', 'final_review'].includes(trx.status) && (
                            <button
                                onClick={() => onApprove(trx)}
                                className="flex-1 py-2.5 bg-emerald-500 text-black rounded-xl font-black text-[9px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                {isCashOut ? '✓ Approve Cash-out' : '✓ Confirm & Credit'}
                            </button>
                        )}
                        {(trx.status === 'pending' || trx.status === 'pending_instructions') && (
                            <button
                                onClick={() => onReject(trx)}
                                className="px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-black text-[9px] uppercase border border-red-500/20 transition-all"
                            >
                                Reject
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
