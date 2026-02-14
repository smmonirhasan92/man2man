export default function Loading() {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-[#0A2540] relative overflow-hidden font-sans text-white">
            {/* Background Flag Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <img src="/bg-flag.png" alt="USA Background" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" />
            </div>

            {/* Central Brand */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                    {/* Glowing Pulse Ring */}
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

                    {/* Brand Icon / Logo Placeholder */}
                    <div className="w-24 h-24 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                        <img src="/logo.png" alt="USA Affiliate" className="w-16 h-16 object-contain drop-shadow-lg" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-xl font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-md">
                        USA Affiliate
                    </h1>
                    <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-blue-500 w-full animate-progress-indeterminate rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress-indeterminate {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    50% { transform: translateX(0%) scaleX(0.5); }
                    100% { transform: translateX(100%) scaleX(0.2); }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 1.5s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
