'use client';
import AdminBottomNav from '../../components/AdminBottomNav';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-[#0D0D0D] p-4 border-b border-white/10 sticky top-0 z-40 flex justify-between items-center">
                    <h1 className="text-lg font-bold tracking-tight">Admin Console</h1>
                    <div className="text-xs bg-pink-600/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30">v3.0</div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
                    {/* Background Noise/Gradient Shared */}
                    <div className="fixed inset-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <div className="lg:hidden">
                    <AdminBottomNav />
                </div>
            </div>
        </div>
    );
}
