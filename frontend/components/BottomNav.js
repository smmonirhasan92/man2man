'use client';
import Link from 'next/link';
import { Home, ClipboardList, User, Globe, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useState, useMemo } from 'react';

/**
 * [V7.2 PROFESSIONAL] Optimized Bottom Navigation
 * Changes:
 * 1. Removed Wallet (Redundant with P2P/Market functions).
 * 2. Added TASKS (Direct access to core earning engine).
 * 3. Navigation: Home, Tasks, Market (FAB), Invite, Profile.
 */
function BottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    const isHidden = useMemo(() => {
        const hiddenRoutes = ['/', '/login', '/register', '/admin', '/agent'];
        return hiddenRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
    }, [pathname]);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 150);
        return () => clearTimeout(timer);
    }, []);

    if (isHidden) return null;

    const navItems = [
        { name: 'Home', href: '/dashboard', icon: Home },
        { name: 'Tasks', href: '/tasks', icon: ClipboardList }, // Direct access to earnings
        { name: 'Market', href: '/p2p', icon: Globe, isFab: true },
        { name: 'Invite', href: '/profile', icon: Users }, // Referral/Team access
        { name: 'Profile', 
          action: () => {
             window.dispatchEvent(new CustomEvent('toggle-profile-drawer'));
          }, 
          icon: User 
        },
    ];

    return (
        <div className={`mobile-only-nav fixed bottom-6 left-0 right-0 w-full flex justify-center z-50 pointer-events-none transition-transform duration-700 md:hidden ${isVisible ? 'translate-y-0' : 'translate-y-32'}`}>
            <div className="pointer-events-auto relative bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-full flex justify-between items-center px-1 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.8)] w-[94%] max-w-[400px] ring-1 ring-white/5">

                {/* Glass Reflection Effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none"></div>

                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = item.href ? pathname === item.href : false;

                    if (item.isFab) {
                        return (
                            <Link key={item.name} href={item.href} className="relative -top-6 group">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <div className={`
                                    w-16 h-16 bg-gradient-to-br from-[#0a192f] to-blue-900 rounded-full flex flex-col items-center justify-center 
                                    shadow-[0_4px_20px_rgba(30,58,138,0.5)] border-4 border-[#050505] transform transition-all duration-300 group-hover:-translate-y-1 group-active:scale-95
                                `}>
                                    <Globe className="w-8 h-8 text-blue-400 fill-blue-900/50 animate-pulse" strokeWidth={1.5} />
                                </div>
                            </Link>
                        )
                    }

                    // Button or Link
                    const Wrapper = item.action ? 'button' : Link;
                    const props = item.action ? { onClick: item.action } : { href: item.href };

                    return (
                        <Wrapper
                            key={item.name}
                            {...props}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 relative group transition-all duration-300`}
                        >
                            {/* Active Indicator Background */}
                            {isActive && (
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md scale-75 opacity-50" />
                            )}

                            <div className={`relative transition-all duration-300 ${isActive ? 'text-amber-400 -translate-y-1' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            {/* Active Text Indicator */}
                            <span className={`
                                text-[9px] font-black tracking-widest transition-all duration-300 absolute -bottom-1 uppercase
                                ${isActive ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-2'}
                            `}>
                                {item.name}
                            </span>
                        </Wrapper>
                    );
                })}
            </div>
        </div >
    );
}

export default memo(BottomNav);
