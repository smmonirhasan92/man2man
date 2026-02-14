'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Smartphone, Globe, Activity, CheckCircle2, Lock, Wifi, Shield, X } from 'lucide-react';

export default function ConnectionFlow({ plan, onComplete, mode = 'connect' }) {
    const [step, setStep] = useState(1);
    const [logs, setLogs] = useState([]);

    const logPrefix = mode === 'connect' ? 'INIT' : 'TERM';
    const THEME = mode === 'connect' ? {
        primary: 'blue',
        accent: 'emerald',
        text: 'text-blue-400',
        textAccent: 'text-emerald-400',
        bgGradient: 'from-blue-500/5',
        icon: Server,
        scanColor: 'bg-blue-400',
        title: 'ESTABLISHING CONNECTION'
    } : {
        primary: 'red',
        accent: 'orange',
        text: 'text-red-500',
        textAccent: 'text-orange-500',
        bgGradient: 'from-red-500/5',
        icon: Shield,
        scanColor: 'bg-red-500',
        title: 'TERMINATING SESSION'
    };

    const addLog = (msg) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        const sequence = async () => {
            if (mode === 'connect') {
                // STEP 1: VPS TRACING (0s - 2s)
                addLog("Initializing Secure Handshake...");
                await new Promise(r => setTimeout(r, 1000));
                addLog(`Tracing VPS Node: ${plan.serverIp || '104.28.XX.XX'}...`);
                await new Promise(r => setTimeout(r, 1500));

                setStep(2);

                // STEP 2: SIM INSERTION (2.5s - 5s)
                addLog("VPS Online. Inserting Digital SIM Module...");
                await new Promise(r => setTimeout(r, 800));
                addLog("USA Carrier Detected (Sprint/T-Mobile)...");
                await new Promise(r => setTimeout(r, 1500));

                setStep(3);

                // STEP 3: MAP CONNECTION (5s - 7.5s)
                addLog("SIM Linked. Establish Global Tunnel...");
                await new Promise(r => setTimeout(r, 1000));
                addLog("Routing: Dhaka -> Singapore -> New York...");
                await new Promise(r => setTimeout(r, 1500));

                setStep(4);

                // STEP 4: VERIFICATION (7.5s - 8.5s)
                addLog("Node Verified. Encryption: AES-256.");
                await new Promise(r => setTimeout(r, 1000));

                setStep(5);
                addLog("Connection Successful.");
                await new Promise(r => setTimeout(r, 1000));
            } else {
                // DISCONNECT SEQUENCE
                // STEP 1: UNLINK (0s - 1.5s)
                addLog("Requesting Termination...");
                await new Promise(r => setTimeout(r, 1000));
                addLog("Unlinking Digital SIM Module...");
                await new Promise(r => setTimeout(r, 1500));

                setStep(2);

                // STEP 2: SEVER TUNNEL (2.5s - 4s)
                addLog("Closing Secure Tunnel...");
                await new Promise(r => setTimeout(r, 1000));
                addLog("Releasing IP Address...");
                await new Promise(r => setTimeout(r, 1500));

                setStep(3);

                // STEP 3: WIPE (5s - 6s)
                addLog("Wiping Session Keys...");
                await new Promise(r => setTimeout(r, 1000));

                setStep(5); // Jump to end visual
                addLog("Disconnection Complete.");
                await new Promise(r => setTimeout(r, 1000));
            }

            onComplete();
        };

        sequence();
    }, [plan, onComplete, mode]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-sans"
        >
            {/* Background Grid */}
            <div className={`absolute inset-0 bg-[linear-gradient(rgba(${mode === 'connect' ? '30,58,138' : '153,27,27'},0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(${mode === 'connect' ? '30,58,138' : '153,27,27'},0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20`}></div>

            {/* Ambient Vertical Sweep */}
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-${THEME.primary}-500/5 to-transparent animate-scan`}></div>

            <div className="relative z-10 w-full max-w-md p-6">

                <h2 className={`text-center text-xs font-black tracking-[0.3em] mb-8 ${THEME.text} animate-pulse`}>
                    {THEME.title}
                </h2>

                {/* --- MAIN VISUAL CONTAINER --- */}
                <div className="h-64 mb-8 relative flex items-center justify-center">

                    {/* STEP 1: VPS SERVER (Connect) OR SHIELD (Disconnect) */}
                    <AnimatePresence>
                        {step === 1 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className="relative"
                            >
                                <div className={`w-32 h-32 bg-slate-900 border border-${THEME.primary}-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(${mode === 'connect' ? '59,130,246' : '239,68,68'},0.2)]`}>
                                    <THEME.icon size={64} className={THEME.text} />
                                </div>
                                {/* Scanning Line */}
                                <motion.div
                                    animate={{ top: ['5%', '95%', '5%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className={`absolute left-2 right-2 h-0.5 ${THEME.scanColor} shadow-[0_0_10px_currentColor]`}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* STEP 2: SIM CARD */}
                    <AnimatePresence>
                        {mode === 'connect' && step === 2 && (
                            <motion.div
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -100, opacity: 0 }}
                                className="relative"
                            >
                                <div className="w-24 h-40 border-2 border-slate-700 rounded-2xl bg-slate-900 relative overflow-hidden">
                                    <div className="absolute inset-2 bg-gradient-to-br from-indigo-900/50 to-transparent rounded-lg"></div>
                                </div>
                                <motion.div
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg border border-yellow-200 shadow-xl flex items-center justify-center z-20"
                                >
                                    <div className="w-8 h-8 grid grid-cols-2 gap-1 opacity-50"><div className="bg-black/20 rounded-sm"></div><div className="bg-black/20 rounded-sm"></div><div className="bg-black/20 rounded-sm col-span-2"></div></div>
                                    <div className="absolute bottom-1 right-1 text-[8px] font-bold text-black/50">US</div>
                                </motion.div>
                            </motion.div>
                        )}
                        {mode === 'disconnect' && step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                className="relative flex items-center justify-center"
                            >
                                <Smartphone size={64} className="text-slate-700 mx-auto" />
                                <X size={32} className="text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* STEP 3 & 4: MAP / FINAL */}
                    <AnimatePresence>
                        {(step >= 3) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative w-full h-full flex items-center justify-center"
                            >
                                <div className="w-48 h-48 rounded-full border border-slate-700 bg-slate-900/50 relative overflow-hidden">
                                    {/* Map or Static Noise for Disconnect */}
                                    <div className={`absolute inset-0 opacity-20 ${mode === 'connect' ? "bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" : "bg-noise"}`}></div>

                                    {mode === 'connect' && (
                                        <svg className="absolute inset-0 w-full h-full overflow-visible">
                                            <motion.path d="M 40 100 Q 120 50 200 100" fill="transparent" stroke="#10B981" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                                            {step >= 3 && <circle cx="40" cy="100" r="3" fill="#3B82F6" className="animate-ping" />}
                                            {step >= 3 && <circle cx="200" cy="100" r="3" fill="#10B981" className="animate-ping" style={{ animationDelay: '1s' }} />}
                                        </svg>
                                    )}
                                </div>

                                {step >= 5 && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full"
                                    >
                                        <div className={`p-4 rounded-full shadow-[0_0_30px_currentColor] ${mode === 'connect' ? 'bg-emerald-500 text-white shadow-[#10B981]' : 'bg-red-500 text-white shadow-[#ef4444]'}`}>
                                            {mode === 'connect' ? <CheckCircle2 size={40} /> : <Lock size={40} />}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- LOGS TERMINAL --- */}
                <div className="bg-black/50 border border-slate-800 rounded-xl p-4 font-mono text-xs h-32 overflow-hidden flex flex-col justify-end shadow-inner">
                    {logs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-slate-400 mb-1"
                        >
                            <span className={`${THEME.text} mr-2`}>[{logPrefix}_{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={log.includes('Verified') || log.includes('Successful') ? 'text-emerald-400' : log.includes('Disconnect') || log.includes('Wipe') || log.includes('Termination') ? 'text-red-400' : 'text-slate-300'}>
                                {log}
                            </span>
                        </motion.div>
                    ))}
                    <div className="w-2 h-4 bg-blue-500 animate-pulse mt-1"></div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-1 mt-6 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${mode === 'connect' ? 'bg-blue-500 shadow-[0_0_10px_#3B82F6]' : 'bg-red-500 shadow-[0_0_10px_#EF4444]'}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

            </div>




        </motion.div >
    );
}
