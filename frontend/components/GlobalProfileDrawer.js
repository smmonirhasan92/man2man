'use client';
import { useState } from 'react';
import ProfileDrawer from './dashboard/ProfileDrawer';
import { useAuth } from '../hooks/useAuth';
import { usePathname } from 'next/navigation';

export default function GlobalProfileDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // Don't show on login/register/admin pages
    // [FIX] Strict checks for root/auth, startsWith only for Admin
    const isPublicOrAdmin = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname?.startsWith('/admin');

    if (isPublicOrAdmin) {
        return null; // Don't render anything
    }

    if (!user) return null;

    return (
        <>
            {/* Floating Trigger - Persistent Top Right */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 z-[9999] w-12 h-12 bg-slate-900/90 backdrop-blur-xl rounded-full border border-emerald-500/50 flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-slate-800 transition active:scale-95 group"
            >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition">
                    <img src={user?.photoUrl ? `https://usaaffiliatemarketing.com/api${user.photoUrl}` : `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" alt="Profile" />

                    {/* Menu Badge */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition backdrop-blur-[1px]">
                        <span className="text-[10px] font-bold">MENU</span>
                    </div>
                </div>

                {/* Notification/Indicator Dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0F172A] animate-pulse"></div>
            </button>

            {/* The Drawer */}
            <ProfileDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                user={user}
                logout={logout}
            />
        </>
    );
}
