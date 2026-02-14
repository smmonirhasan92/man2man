import React from 'react';

export default function TransactionCard({
    trx,
    agents,
    selectedAgentId,
    onSelectAgent,
    onAssign,
    onApprove,
    onReject
}) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            {/* Decorative Blur */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full mix-blend-multiply opacity-5 blur-2xl ${trx.type === 'add_money' ? 'bg-green-500' : 'bg-blue-500'}`}></div>

            {/* Main Row */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${trx.type === 'add_money' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                        {trx.type === 'add_money' ? '💰' : '⚡'}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">{trx.User?.fullName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500">{trx.User?.phone}</span>
                            <span className="text-xs text-slate-400">• {formatDate(trx.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex flex-col items-end">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 shadow-sm ${trx.type === 'add_money' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {trx.type.replace('_', ' ')}
                        </span>
                        <span className="text-xl font-black text-slate-800 tracking-tight">৳{trx.amount}</span>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-slate-50/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100/60 mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Instruction</p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed break-words">
                    {trx.recipientDetails}
                </p>
                {trx.proofImage && (
                    <a href={`https://usaaffiliatemarketing.com/api/${trx.proofImage}`} target="_blank" className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">📷</div>
                        <span>View Proof Screenshot</span>
                    </a>
                )}
            </div>

            {/* Actions */}
            <div className="relative z-10">
                {trx.type === 'add_money' || trx.type === 'recharge' || trx.type === 'agent_recharge' || trx.type === 'agent_withdraw' ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => onReject(trx)}
                            className="flex-1 py-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm shadow-sm border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-all"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => onApprove(trx)}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span>Approve Request</span>
                            <span className="text-slate-500">→</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="relative w-full">
                            <select
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all hover:bg-slate-100"
                                onChange={(e) => onSelectAgent(trx._id, e.target.value)}
                                value={selectedAgentId || ""}
                            >
                                <option value="" disabled className="text-slate-400">Select Agent to Assign</option>
                                {agents.map(a => <option key={a._id} value={a._id}>{a.fullName}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onReject(trx)}
                                className="flex-1 py-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm shadow-sm border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-all"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => onAssign(trx._id)}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                            >
                                Assign Task
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
