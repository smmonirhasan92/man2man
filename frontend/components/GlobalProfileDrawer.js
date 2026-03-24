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
