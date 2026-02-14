'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function VerificationModal({ plan, onClose, onSuccess }) {
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleVerify = async () => {
        setVerifying(true);
        setError('');

        // Simulate Network Delay for "Security Check"
        setTimeout(() => {
            const normalize = (s) => s ? String(s).replace(/[^0-9]/g, '') : '';
            const cleanInput = normalize(inputKey);
            const cleanTarget = normalize(plan.syntheticPhone);

            if (cleanInput === cleanTarget && cleanTarget.length > 5) {
                setVerifying(false);
                onSuccess(plan);
            } else {
                setVerifying(false);
                setError('Authentication Failed: ID Mismatch. Please copy EXACTLY.');
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
            >
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        <span className="font-bold text-white">Security Gateway</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <div className="mb-6 bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                        <p className="text-blue-200 text-sm flex gap-2">
                            <Lock size={16} className="shrink-0 mt-0.5" />
                            <span>For your security, please verify ownership of the assigned USA Number to activate this server.</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Assigned Identity</label>
                            <div className="bg-slate-950 p-3 rounded border border-slate-700 font-mono text-emerald-400 text-lg text-center tracking-widest select-all">
                                {plan.syntheticPhone}
                            </div>
                            <p className="text-[10px] text-center text-slate-500 mt-1">(Copy this number)</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Verify Identity</label>
                            <input
                                type="text"
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                placeholder="Paste +1 (XXX) Number Here"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm font-bold flex items-center justify-center gap-2 bg-red-500/10 p-2 rounded"
                            >
                                <AlertTriangle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <button
                            onClick={handleVerify}
                            disabled={verifying || !inputKey}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${verifying ? 'bg-slate-700 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                                }`}
                        >
                            {verifying ? 'Verifying Credentials...' : 'Authenticate Connection'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
