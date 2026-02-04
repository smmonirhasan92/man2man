'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, X } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onClose, onAccept, plan }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f172a] w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden relative"
            >
                {/* Header */}
                <div className="bg-red-900/20 px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
                        <h3 className="text-lg font-bold text-white tracking-wide">SECURITY ALERT</h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                        <p className="text-sm font-medium text-slate-300 leading-relaxed">
                            You are engaging in a <span className="text-white font-bold">cloud-infrastructure rental</span>.
                            Earnings are strictly performance-based and <span className="text-red-400 font-bold">non-guaranteed</span>.
                        </p>
                    </div>

                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2"></div>
                            <p className="text-xs text-slate-400">The platform bears no liability for server-side disruptions or volatility.</p>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2"></div>
                            <p className="text-xs text-slate-400">Investment risks are solely the user's responsibility.</p>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2"></div>
                            <p className="text-xs text-slate-400 font-bold uppercase">NO REFUNDS ALLOWED ONCE DEPLOYED.</p>
                        </li>
                    </ul>

                    <div className="pt-4">
                        <button
                            onClick={onAccept}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            I ACCEPT & PROCEED
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
