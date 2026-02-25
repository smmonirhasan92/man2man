'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Smartphone, Shield, Activity, CheckCircle2, Lock, Cpu, Radio, Zap } from 'lucide-react';

export default function ConnectionFlow({ plan, onComplete, mode = 'connect' }) {
    const [step, setStep] = useState(1);
    const [logs, setLogs] = useState([]);
    const [matrixText, setMatrixText] = useState('');

    const logPrefix = mode === 'connect' ? 'SYS_CONNECT' : 'SYS_TERM';
    const THEME = mode === 'connect' ? {
        text: 'text-cyan-400',
        bg: 'bg-cyan-900/20',
        border: 'border-cyan-500/50',
        shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
        pulseBorder: 'border-cyan-400',
        laserBg: 'bg-cyan-500',
        laserOrb: 'bg-cyan-300',
        radial: 'rgba(6,182,212,0.15)',
        bar: 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]',
        icon: Server,
        title: 'ESTABLISHING SECURE UPLINK'
    } : {
        text: 'text-red-500',
        bg: 'bg-red-900/20',
        border: 'border-red-500/50',
        shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
        pulseBorder: 'border-red-400',
        laserBg: 'bg-red-500',
        laserOrb: 'bg-red-300',
        radial: 'rgba(239,68,68,0.15)',
        bar: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
        icon: Shield,
        title: 'SEVERING CONNECTION'
    };

    const addLog = (msg) => setLogs(prev => [...prev, msg]);

    // Matrix background effect
    useEffect(() => {
        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
        const interval = setInterval(() => {
            let str = '';
            for (let i = 0; i < 20; i++) {
                str += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            setMatrixText(str);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const sequence = async () => {
            if (mode === 'connect') {
                addLog("Initializing Quantum Handshake...");
                await new Promise(r => setTimeout(r, 800));
                addLog(`Targeting Node: ${plan?.serverIp || '204.14.XX.XX'}...`);
                await new Promise(r => setTimeout(r, 1200));

                setStep(2);
                addLog("Authenticating Digital Signature...");
                await new Promise(r => setTimeout(r, 800));
                addLog("Bypassing firewalls [OK]");
                await new Promise(r => setTimeout(r, 1200));

                setStep(3);
                addLog("Injecting routing protocols...");
                await new Promise(r => setTimeout(r, 800));
                addLog("Secure Tunnel Established.");
                await new Promise(r => setTimeout(r, 1500));

                setStep(4);
                addLog("Verifying Encryption: AES-256-GCM...");
                await new Promise(r => setTimeout(r, 1000));

                setStep(5);
                addLog("Uplink Successful. Connection LIVE.");
                await new Promise(r => setTimeout(r, 1200));
            } else {
                addLog("Initiating Termination Protocol...");
                await new Promise(r => setTimeout(r, 800));
                addLog("Revoking Access Tokens...");
                await new Promise(r => setTimeout(r, 1200));

                setStep(2);
                addLog("Severing Encrypted Tunnel...");
                await new Promise(r => setTimeout(r, 1000));

                setStep(3);
                addLog("Zeroizing Session Keys...");
                await new Promise(r => setTimeout(r, 1000));

                setStep(5);
                addLog("Disconnection Finalized.");
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
            {/* High-Tech Backgrounds */}
            <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,${THEME.radial}_0%,transparent_70%)]`}></div>
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0gMCAwIEwgNDAgNDAgTSA0MCAwIEwgMCA0MCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC41Ii8+Cjwvc3ZnPg==')] bg-repeat"></div>

            {/* Dynamic Data Stream Background */}
            <div className={`absolute top-0 right-4 bottom-0 w-8 overflow-hidden opacity-20 font-mono text-[10px] leading-3 break-all ${THEME.text}`} style={{ writingMode: 'vertical-rl' }}>
                {matrixText.repeat(10)}
            </div>
            <div className={`absolute top-0 left-4 bottom-0 w-8 overflow-hidden opacity-20 font-mono text-[10px] leading-3 break-all ${THEME.text}`} style={{ writingMode: 'vertical-rl' }}>
                {matrixText.repeat(10)}
            </div>

            <div className="relative z-10 w-full max-w-md p-6">
                {/* Header */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <Activity className={`w-6 h-6 animate-pulse ${THEME.text}`} />
                    <h2 className={`text-center text-sm font-black tracking-[0.4em] ${THEME.text}`}>
                        {THEME.title}
                    </h2>
                    <Activity className={`w-6 h-6 animate-pulse ${THEME.text}`} />
                </div>

                {/* Main Animation Container */}
                <div className="h-64 mb-10 relative flex items-center justify-center">

                    {/* Step 1 & 2: Node Scanning & Handshake */}
                    <AnimatePresence>
                        {(step === 1 || step === 2) && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className="relative flex items-center justify-center"
                            >
                                {/* Core Reactor */}
                                <div className={`w-40 h-40 rounded-full border-2 ${THEME.border} border-dashed animate-[spin_10s_linear_infinite] absolute`}></div>
                                <div className={`w-32 h-32 rounded-full border border-solid ${THEME.border} animate-[spin_5s_linear_infinite_reverse] absolute`}></div>

                                <div className={`w-24 h-24 ${THEME.bg} backdrop-blur-md border ${THEME.border} rounded-full flex items-center justify-center relative z-10 ${THEME.shadow}`}>
                                    <THEME.icon className={`w-10 h-10 ${THEME.text} animate-pulse`} />
                                </div>

                                {/* Pulse Rings */}
                                <motion.div
                                    animate={{ scale: [1, 2, 3], opacity: [0.8, 0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                    className={`absolute inset-0 rounded-full border ${THEME.pulseBorder} m-auto w-24 h-24`}
                                />
                                <motion.div
                                    animate={{ scale: [1, 2, 3], opacity: [0.8, 0.3, 0] }}
                                    transition={{ duration: 2, delay: 1, repeat: Infinity, ease: 'easeOut' }}
                                    className={`absolute inset-0 rounded-full border ${THEME.pulseBorder} m-auto w-24 h-24`}
                                />

                                {/* Step 2 Addition: Targeting Data */}
                                {step === 2 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute -right-24 top-0 bg-black/80 border ${THEME.border} p-2 rounded-lg text-[10px] font-mono ${THEME.text} shadow-2xl`}>
                                        <div className="flex items-center gap-1"><Radio className="w-3 h-3" /> IP: {plan?.serverIp || '204.14.XX.XX'}</div>
                                        <div className="flex items-center gap-1 mt-1"><Zap className="w-3 h-3" /> LAT: {Math.floor(Math.random() * 50)}ms</div>
                                        <div className="flex items-center gap-1 mt-1"><Lock className="w-3 h-3" /> ENC: AES-256</div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step 3 & 4: Connection Link (The Beam) */}
                    <AnimatePresence>
                        {(step === 3 || step === 4) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative w-full h-full flex items-center justify-between px-2"
                            >
                                {/* Client Node */}
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                        <Smartphone className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-2 font-mono tracking-widest">LOCAL_NODE</div>
                                </div>

                                {/* The Beam */}
                                <div className="flex-1 relative h-32 flex items-center justify-center mx-2 z-0">
                                    {/* Laser */}
                                    <div className={`absolute left-0 right-0 h-1.5 ${THEME.laserBg} shadow-[0_0_15px_currentColor]`}></div>
                                    {/* Data Packets */}
                                    <motion.div
                                        animate={mode === 'connect' ? { left: ['0%', '100%'] } : { right: ['0%', '100%'] }}
                                        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                                        className={`absolute h-4 w-12 bg-white rounded-full shadow-[0_0_15px_white] z-20 top-1/2 -mt-2`}
                                    />
                                    <motion.div
                                        animate={mode === 'connect' ? { left: ['0%', '100%'] } : { right: ['0%', '100%'] }}
                                        transition={{ duration: 0.4, delay: 0.2, repeat: Infinity, ease: 'linear' }}
                                        className={`absolute h-3 w-6 ${THEME.laserOrb} rounded-full shadow-[0_0_10px_currentColor] z-20 top-1/2 -mt-1.5`}
                                    />

                                    {/* Encryption Shield rotating around beam */}
                                    {step === 4 && mode === 'connect' && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute bg-[#020617] border border-emerald-500 p-2.5 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.5)] z-30"
                                        >
                                            <Shield className="w-7 h-7 text-emerald-400" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Server Node */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-2xl ${THEME.bg} border ${THEME.border} flex items-center justify-center relative z-10 ${THEME.shadow}`}>
                                        <Server className={`w-8 h-8 ${THEME.text}`} />
                                    </div>
                                    <div className={`text-[10px] ${THEME.text} mt-2 font-mono tracking-widest`}>{mode === 'connect' ? 'USA_HOST' : 'OFFLINE'}</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step 5: Final Check/Lock */}
                    <AnimatePresence>
                        {step === 5 && (
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-3xl" />
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className={`p-6 rounded-full shadow-[0_0_50px_currentColor] ${mode === 'connect' ? 'bg-emerald-500 text-white shadow-emerald-500' : 'bg-red-500 text-white shadow-red-500'}`}>
                                        {mode === 'connect' ? <CheckCircle2 size={56} /> : <Lock size={56} />}
                                    </div>
                                    <div className={`text-xl font-black tracking-widest ${mode === 'connect' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {mode === 'connect' ? 'SECURED' : 'TERMINATED'}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Terminal Console */}
                <div className="bg-[#0b1120] border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl relative">
                    <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-700/80 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono tracking-widest">SYSTEM_SHELL_V2</div>
                    </div>
                    <div className="p-4 font-mono text-[11px] h-32 overflow-hidden flex flex-col justify-end">
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-1.5 flex items-start gap-2"
                            >
                                <span className={`${THEME.text} shrink-0`}>[{logPrefix}]</span>
                                <span className={`break-words leading-relaxed ${log.includes('Verified') || log.includes('Successful') || log.includes('LIVE') ? 'text-emerald-400 font-bold' :
                                        log.includes('Disconnect') || log.includes('Wipe') || log.includes('Termination') || log.includes('Zeroizing') ? 'text-red-400 font-bold' :
                                            'text-slate-300'
                                    }`}>
                                    {log}
                                </span>
                            </motion.div>
                        ))}
                        <div className="flex items-center gap-2 mt-1">
                            <span className={THEME.text}>[{logPrefix}]</span>
                            <div className="w-2 h-3.5 bg-slate-300 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#0b1120] h-1.5 mt-6 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
                    <motion.div
                        className={`absolute top-0 bottom-0 left-0 ${THEME.bar}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

            </div>
        </motion.div >
    );
}
