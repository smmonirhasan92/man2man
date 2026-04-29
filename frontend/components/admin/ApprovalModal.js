import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function ApprovalModal({
    show,
    onClose,
    onConfirm,
    bonusAmount,
    setBonusAmount,
    adminComment,
    setAdminComment,
    receivedAgent,
    setReceivedAgent,
    agents,
    secKeys = { k1: '', k2: '', k3: '' },
    setSecKeys,
    transaction // [NEW] pass full trx to detect type
}) {
    if (!show) return null;

    const isCashOut = transaction?.type === 'cash_out' || transaction?.type === 'withdraw';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-full max-w-sm scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-1 text-slate-800">
                    {isCashOut ? 'Approve Cash-out' : 'Approve Deposit'}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                    {isCashOut ? 'Confirm you have sent the money to the user.' : 'Confirm transaction and credit balance.'}
                </p>

                <div className="space-y-4">
                    {/* Bonus Amount — Only for Deposits */}
                    {!isCashOut && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                                <span>Bonus Amount</span>
                                <span className="text-[10px] text-emerald-600">Rate: 1.23 BDT</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-emerald-600 font-black text-[10px]">NXS</span>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 p-3 pl-12 rounded-xl text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-black transition-all"
                                    placeholder="0"
                                    value={bonusAmount}
                                    onChange={(e) => setBonusAmount(e.target.value)}
                                />
                                {bonusAmount > 0 && (
                                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                                        <span className="text-[9px] font-black text-emerald-700 uppercase">Est. Payable</span>
                                        <span className="text-xs font-black text-emerald-700">{(bonusAmount * 1.23).toLocaleString()} BDT</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Received By Agent — Only for Deposits */}
                    {!isCashOut && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Received By Agent (Optional)</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none appearance-none font-medium transition-all"
                                    value={receivedAgent}
                                    onChange={(e) => setReceivedAgent(e.target.value)}
                                >
                                    <option value="">-- Direct / Bank --</option>
                                    {agents.map(a => <option key={a._id} value={a._id}>{a.fullName} ({a.phone})</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>
                    )}

                    {/* Admin Comment */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Admin Note (Optional)</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none font-medium transition-all resize-none h-16 text-sm"
                            placeholder="Add a note..."
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                        />
                    </div>

                    {/* Security Keys — Only for Deposits */}
                    {!isCashOut && (
                        <div>
                            <label className="block text-[8px] font-black text-red-500 uppercase tracking-[0.2em] mb-2 opacity-80">Super Admin Security Keys (Req. for Balance)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['k1', 'k2', 'k3'].map((k, i) => (
                                    <input
                                        key={k}
                                        type="password"
                                        maxLength={4}
                                        className="w-full bg-red-50/30 border border-red-100 p-2 rounded-lg text-center text-xs font-black text-red-600 focus:border-red-500 outline-none transition-all placeholder:text-red-200"
                                        placeholder={`K${i + 1}`}
                                        value={secKeys[k]}
                                        onChange={(e) => setSecKeys({ ...secKeys, [k]: e.target.value })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all ${
                            isCashOut
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                        }`}
                    >
                        {isCashOut ? '✓ Mark as Sent' : 'Confirm & Credit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
