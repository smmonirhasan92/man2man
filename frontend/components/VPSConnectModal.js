'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Globe, Server, Wifi, Cpu, Activity, CheckCircle2 } from 'lucide-react';

export default function VPSConnectModal({ plan, onComplete }) {
    const [phase, setPhase] = useState(0);

    // Sequence Timing: 7 Seconds Total
    useEffect(() => {
        const sequence = async () => {
            // Phase 1: Authentication (0-2.5s)
            setPhase(1);
            await new Promise(r => setTimeout(r, 2500));

            // Phase 2: Tunneling (2.5-5s)
            setPhase(2);
            await new Promise(r => setTimeout(r, 2500));

            // Phase 3: Encryption (5-7s)
            setPhase(3);
            await new Promise(r => setTimeout(r, 2000));

            // Done
            onComplete();
        };
        sequence();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* --- Cyber Background Grid --- */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)]"></div>

            {/* --- Glowing USA Flag Overlay --- */}
            <div className="absolute inset-0 bg-[url('/bg-flag.png')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

            {/* --- Central HUD --- */}
            <div className="relative z-10 w-full max-w-lg p-8 flex flex-col items-center">

                {/* 3D Rotating Shield & Emblem */}
                <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
                    {/* Outer Rings */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-slate-700/50 border-t-cyan-500 border-r-blue-500"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border border-slate-700/50 border-b-emerald-500 border-l-purple-500 opacity-70"
                    />

                    {/* Pulsing Core */}
                    <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>

                    {/* Shield Icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="relative z-10 bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)]"
                    >
                        <Shield size={64} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" fill="rgba(37,99,235,0.2)" />
                        <div className="absolute -top-1 -right-1">
                            <Activity size={16} className="text-emerald-400 animate-pulse" />
                        </div>
                    </motion.div>
                </div>

                {/* Cyber Text Interface */}
                <div className="w-full space-y-6">

                    {/* Phase 1: Auth */}
                    <PhaseItem
                        active={phase === 1}
                        completed={phase > 1}
                        icon={Globe}
                        label="Authenticating with USA Global Proxy..."
                        detail="Routing via Washington D.C. Node"
                    />

                    {/* Phase 2: Tunneling */}
                    <PhaseItem
                        active={phase === 2}
                        completed={phase > 2}
                        icon={Server}
                        label="Tunneling via VPS: New York City Gateway..."
                        detail={`Target: ${plan.planName} (Latency: <15ms)`}
                    />

                    {/* Phase 3: Encryption */}
                    <PhaseItem
                        active={phase === 3}
                        completed={phase > 3}
                        icon={Lock}
                        label="Encryption Active: AES-256 Tunnel Established."
                        detail="Secure Handshake Verified"
                        isLast
                    />

                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-800 mt-12 overflow-hidden rounded-full">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: phase === 1 ? "33%" : phase === 2 ? "66%" : "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                    />
                </div>

                <p className="mt-4 text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                    USA SECURE NETWORK • VER: 5.0.2 • ID: {plan.syntheticPhone}
                </p>

            </div>
        </motion.div>
    );
}

function PhaseItem({ active, completed, icon: Icon, label, detail, isLast }) {
    return (
        <div className={`flex items-center gap-4 transition-all duration-500 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-500
                ${completed ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                    active ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                        'bg-slate-800 border-slate-700 text-slate-600'}
            `}>
                {completed ? <CheckCircle2 size={20} /> : <Icon size={20} className={active ? 'animate-pulse' : ''} />}
            </div>
            <div className="flex-1">
                <h4 className={`text-sm font-bold font-mono transition-colors duration-300 ${active ? 'text-white' : completed ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {label}
                </h4>
                {active && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-cyan-400 font-mono mt-1 tracking-wider"
                    >
                        {'>'} {detail}
                    </motion.p>
                )}
            </div>
        </div>
    );
}
