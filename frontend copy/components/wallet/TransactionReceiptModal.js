'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Receipt, X, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function TransactionReceiptModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    const { amount, netAmount, fees, txId, timestamp } = data;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            >
                {/* Printing Animation Effect Container */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="bg-white w-full max-w-sm relative shadow-2xl overflow-hidden"
                    style={{
                        backgroundImage: 'radial-gradient(#f0f0f0 1px, transparent 1px)',
                        backgroundSize: '10px 10px'
                    }}
                >
                    {/* Jaggered Top Edge (Receipt style) */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-slate-900" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

                    {/* Content */}
                    <div className="pt-8 pb-6 px-6">

                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-emerald-50">
                                <CheckCircle size={32} className="text-emerald-600" />
                            </div>
                        </div>

                        <h2 className="text-center text-slate-800 font-black text-xl mb-1 uppercase tracking-wider">Transaction Approved</h2>
                        <p className="text-center text-slate-400 text-xs font-mono mb-6">{timestamp || new Date().toLocaleString()}</p>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-medium">Requested Amount</span>
                                <span className="font-bold text-slate-800 font-mono">${amount?.toFixed(2)}</span>
                            </div>

                            {/* Itemized Fees */}
                            <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                                <Row label="Exchange Fee (2%)" value={`-$${fees?.exchange?.toFixed(2)}`} isDeduct />
                                <Row label="Sys. Maintenance Tax" value={`-$${fees?.maintenance?.toFixed(2)}`} isDeduct />
                                <Row label="USA Gateway Charge" value={`-$${fees?.gateway?.toFixed(2)}`} isDeduct />
                            </div>

                            {/* Conversion Section */}
                            {fees?.conversionRate && (
                                <div className="py-2 border-t border-slate-200 mt-2">
                                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                                        <span>Net USD</span>
                                        <span className="font-mono text-slate-700 font-bold">${(amount - fees.totalFee).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Rate (USD→BDT)</span>
                                        <span className="font-mono text-slate-700">x {fees.conversionRate}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-800 border-dashed">
                                <span className="text-slate-900 font-black uppercase text-sm">Amount Credited</span>
                                <span className="font-black text-emerald-600 text-xl font-mono">
                                    {fees?.conversionRate ? '৳' : '$'}{netAmount?.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="bg-slate-100 p-3 rounded text-[10px] text-slate-400 font-mono break-all text-center mb-4">
                            TX ID: {txId || 'TXN-UNKNOWN-NULL'}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Receipt size={16} /> Close Receipt
                        </button>
                    </div>

                    {/* Jaggered Bottom Edge */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-900" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function Row({ label, value, isDeduct }) {
    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">{label}</span>
            <span className={`font-mono font-medium ${isDeduct ? 'text-red-500' : 'text-slate-700'}`}>{value}</span>
        </div>
    );
}
