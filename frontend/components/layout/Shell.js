'use client';
import { usePathname } from 'next/navigation';

export default function Shell({ children }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    // Admin: Full Width, centered content but allowed to expand
    // App: Fixed 450px Mobile Shell

    if (isAdmin) {
        return (
            <div className="min-h-screen w-full bg-[#0D0D0D] text-white">
                {/* Admin is not constrained by the phone shell */}
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#050505] flex justify-center items-center relative font-sans text-white">
            {/* Desktop Background Effects (Blur/Nebula) - Only for App Mode */}
            <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* App Container (Constrained for PWA feel on Desktop) */}
            <div className="w-full max-w-[450px] min-h-screen bg-[#0D0D0D] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-800/30">
                {children}
            </div>
        </div>
    );
}
