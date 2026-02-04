'use client';
import { useState, useEffect } from 'react';
import ProfileDrawer from './dashboard/ProfileDrawer';
import { useAuth } from '../hooks/useAuth';
import { User, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function GlobalProfileDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // Don't show on login/register pages
    if (['/', '/login', '/register', '/admin'].some(p => pathname.startsWith(p)) && pathname !== '/dashboard') {
        // Simple check, refine as needed. Actually, if user is logged in, show it?
        // Let's rely on user existence.
    }

    if (!user) return null;

    return (
        <>
            {/* Floating Trigger - Persistent Top Right */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 z-40 w-10 h-10 bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white shadow-lg hover:bg-slate-700 transition active:scale-95"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                    <img src={user?.photoUrl ? `https://usaaffiliatemarketing.com/api${user.photoUrl}` : `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`} className="w-full h-full object-cover" />
                </div>
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
