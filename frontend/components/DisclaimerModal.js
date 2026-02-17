'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, X } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onClose, onAccept, plan, isWarning }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden relative ${isWarning ? 'bg-[#1a0505] border-red-500' : 'bg-[#0f172a] border-red-500/30'}`}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${isWarning ? 'bg-red-900/50 border-red-500' : 'bg-red-900/20 border-red-500/20'}`}>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className={`w-6 h-6 animate-pulse ${isWarning ? 'text-white' : 'text-red-500'}`} />
                        <h3 className="text-lg font-bold text-white tracking-wide">
                            {isWarning ? 'OVERWRITE WARNING' : 'SECURITY ALERT'}
                        </h3>
                    </div>
                    {isWarning && <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded font-black">ACTION REQUIRED</span>}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* [WARNING STATE] */}
                    {isWarning ? (
                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/50 animate-pulse">
                            <p className="text-sm font-bold text-red-100 leading-relaxed">
                                ⚠️ You already have an active node connection.
                            </p>
                            <p className="text-xs text-red-200 mt-2">
                                Proceeding will <span className="underline font-black">TERMINATE your current session</span> and <span className="underline font-black">FORFEIT any remaining days or limit</span> on the old plan.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <p className="text-sm font-medium text-slate-300 leading-relaxed">
                                You are engaging in a <span className="text-white font-bold">cloud-infrastructure rental</span>.
                                Earnings are strictly performance-based and <span className="text-red-400 font-bold">non-guaranteed</span>.
                            </p>
                        </div>
                    )}

                    <ul className="space-y-3">
                        {isWarning ? (
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-xs text-slate-300">I understand that my old plan will be deleted immediately.</p>
                            </li>
                        ) : (
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2"></div>
                                <p className="text-xs text-slate-400">The platform bears no liability for server-side disruptions or volatility.</p>
                            </li>
                        )}
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2"></div>
                            <p className="text-xs text-slate-400 font-bold uppercase">NO REFUNDS ALLOWED ONCE DEPLOYED.</p>
                        </li>
                    </ul>

                    <div className="pt-4">
                        <button
                            onClick={onAccept}
                            className={`w-full py-4 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider ${isWarning ? 'bg-red-600 hover:bg-red-700 shadow-red-900/40' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
                        >
                            {isWarning ? 'CONFIRM OVERWRITE' : 'I ACCEPT & PROCEED'}
                            <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 mt-3 text-slate-500 hover:text-white text-xs font-bold transition-colors"
                        >
                            CANCEL DEPLOYMENT
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
