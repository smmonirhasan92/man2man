'use client';
import Link from 'next/link';
import { Home, Users, DollarSign, ListChecks, Settings, Gamepad2, ShieldAlert, Ticket } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AdminBottomNav() {
    const pathname = usePathname();

    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Transactions', href: '/admin/transactions', icon: DollarSign },
    { name: 'Requests', href: '/admin/requests', icon: ListChecks },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Lottery', href: '/admin/lottery', icon: Ticket },
    { name: 'Settings', href: '/admin/settings', icon: Settings },

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.2)] text-white z-50">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                    <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 transition ${isActive ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
                        {item.name === 'Users' ? (
                            <>
                                <Users size={28} />
                                <span className="text-xs mt-1 font-bold">Users</span>
                            </>
                        ) : (
                            <>
                                <Icon className="w-7 h-7" />
                                <span className="text-xs font-medium">{item.name}</span>
                            </>
                        )}
                    </Link>
                )
            })}
        </div>
    );
}
