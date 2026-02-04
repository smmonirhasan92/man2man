'use client';
import Link from 'next/link';
import { Home, Wallet, Gamepad2, User, Settings, Zap, Ticket, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Routes where BottomNav should be HIDDEN
    const hiddenRoutes = ['/', '/register', '/admin', '/agent'];
    const isHidden = hiddenRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    if (isHidden) return null;

    const navItems = [
        { name: 'Home', href: '/dashboard', icon: Home },
        { name: 'Games', href: '/game-center', icon: Gamepad2 },
        { name: 'Lottery', href: '/lottery', icon: Ticket },
        { name: 'Marketplace', href: '/marketplace', icon: Globe, isFab: true },
        { name: 'Wallet', href: '/wallet/recharge', icon: Wallet },
        { name: 'Member', action: () => setIsMenuOpen(!isMenuOpen), icon: User },
    ];

    return (
        <>
            {/* Slide-Up Member Menu (Premium Dark/Gold) */}
            <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 rounded-t-3xl bg-[#111] border-t border-amber-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] p-6 pb-32 ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-8"></div>
                <div className="grid grid-cols-4 gap-6">
                    <Link href="/profile" className="flex flex-col items-center gap-3 text-zinc-400 hover:text-amber-400 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-amber-500/50 shadow-lg group-hover:shadow-amber-500/10 transition-all"><User className="w-6 h-6" /></div>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Profile</span>
                    </Link>
                    <Link href="/history" className="flex flex-col items-center gap-3 text-zinc-400 hover:text-amber-400 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-amber-500/50 shadow-lg group-hover:shadow-amber-500/10 transition-all"><Ticket className="w-6 h-6" /></div>
                        <span className="text-[10px] font-bold tracking-widest uppercase">History</span>
                    </Link>
                    <Link href="/referral" className="flex flex-col items-center gap-3 text-zinc-400 hover:text-amber-400 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-amber-500/50 shadow-lg group-hover:shadow-amber-500/10 transition-all"><Zap className="w-6 h-6" /></div>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Rewards</span>
                    </Link>
                    <Link href="/settings" className="flex flex-col items-center gap-3 text-zinc-400 hover:text-amber-400 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-amber-500/50 shadow-lg group-hover:shadow-amber-500/10 transition-all"><Settings className="w-6 h-6" /></div>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Settings</span>
                    </Link>
                </div>
            </div>

            {/* Overlay */}
            {isMenuOpen && (
                <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/80 z-30 backdrop-blur-sm transition-opacity duration-300"></div>
            )}

            {/* Bottom Nav Bar */}
            <div className={`fixed bottom-6 left-0 right-0 w-full flex justify-center z-50 pointer-events-none transition-transform duration-700 md:hidden ${isVisible ? 'translate-y-0' : 'translate-y-32'}`}>
                <div className="pointer-events-auto relative bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-full flex justify-between items-center px-1 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.8)] w-[92%] max-w-[400px] ring-1 ring-white/5">

                    {/* Glass Reflection Effect */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none"></div>

                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = item.href ? pathname === item.href : isMenuOpen && item.name === 'Member';

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
                                className={`
                                    flex-1 flex flex-col items-center justify-center gap-1 py-3 relative group
                                    transition-all duration-300
                                `}
                            >
                                {/* Active Indicator Background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md scale-75 opacity-50" />
                                )}

                                <div className={`relative transition-all duration-300 ${isActive ? 'text-amber-400 -translate-y-1' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>

                                {/* Active Dot Indicator (Text) */}
                                <span className={`
                                    text-[10px] font-bold tracking-wide transition-all duration-300 absolute -bottom-1
                                    ${isActive ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-2'}
                                `}>
                                    {item.name}
                                </span>
                            </Wrapper>
                        );
                    })}
                </div>
            </div >
        </>
    );
}
