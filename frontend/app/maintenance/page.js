'use client';
import { motion } from 'framer-motion';
import { Crown, Hourglass, Settings, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden text-[#d4af37]">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black opacity-80" />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(212,175,55,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 flex flex-col items-center max-w-lg text-center p-8 border border-[#d4af37]/20 rounded-3xl bg-[#0f172a]/60 backdrop-blur-xl shadow-2xl"
            >
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-[#d4af37] blur-3xl opacity-20 rounded-full"></div>
                    <Hourglass className="w-20 h-20 text-[#d4af37] animate-pulse relative z-10" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-dashed border-[#d4af37]/30 rounded-full w-full h-full scale-150"
                    />
                </div>

                <h1 className="text-4xl font-black uppercase tracking-widest mb-2 drop-shadow-lg flex items-center gap-3">
                    <Settings className="w-8 h-8 animate-spin-slow" /> System Update
                </h1>

                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mb-6 opacity-50"></div>

                <p className="text-lg text-slate-300 font-light leading-relaxed mb-8">
                    We are currently upgrading the <span className="text-[#d4af37] font-bold">Royal Architecture</span> to bring you a superior experience.
                    <br /><br />
                    <span className="text-sm uppercase tracking-widest opacity-70">Estimated downtime: ~30 Minutes</span>
                </p>

                <div className="flex gap-4">
                    {/* Bypass for Admin (Hidden logic or separate route, here just a link to admin login) */}
                    <a href="/admin" className="text-xs text-[#d4af37]/30 hover:text-[#d4af37] transition uppercase tracking-widest flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Admin Access
                    </a>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-8 text-[#d4af37]/20 text-xs font-mono uppercase tracking-[0.2em]">
                System Maintenance • Mode Active
            </div>
        </div>
    );
}
