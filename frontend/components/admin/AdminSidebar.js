'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Wallet, ScrollText, Ticket, Settings, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const links = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Transactions', href: '/admin/transactions', icon: Wallet },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Lottery', href: '/admin/lottery', icon: Ticket },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    return (
        <aside className={`flex flex-col bg-[#0a0a0a] border-r border-[#333] h-screen sticky top-0 transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-64 shrink-0'}`}>
            <div className={`p-4 border-b border-[#333] flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="text-xl font-black text-white tracking-tighter">
                            <span className="text-pink-500">GOD</span> MODE
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Admin</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                } ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? link.name : ''}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-pink-400'}`} />
                            {!collapsed && <span className="font-medium text-sm whitespace-nowrap overflow-hidden">{link.name}</span>}

                            {/* Hover Tooltip for Collapsed Mode (optional, simple CSS) */}
                            {collapsed && (
                                <div className="absolute left-full ml-4 bg-black border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 whitespace-nowrap shadow-xl">
                                    {link.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-[#333]">
                <button className={`flex items-center gap-3 px-3 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition ${collapsed ? 'justify-center' : ''}`}>
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium text-sm whitespace-nowrap">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
