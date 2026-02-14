'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ticket } from 'lucide-react';
import AdminLotteryManager from '@/components/admin/AdminLotteryManager';
import AdminLotteryTemplates from '@/components/admin/AdminLotteryTemplates';

export default function AdminLotteryPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505] font-sans pb-20 text-white">
            <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <header className="bg-[#0D0D0D] border-b border-[#D4AF37]/20 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="w-full px-6 lg:px-10 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 transition">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <h1 className="text-xl font-black uppercase tracking-widest text-pink-500 flex items-center gap-2">
                        <Ticket className="w-6 h-6" /> Lottery Manager
                    </h1>
                </div>
            </header>

            <main className="w-full max-w-full px-4 lg:px-8 py-6 relative z-10 space-y-6">
                <AdminLotteryManager />
                <AdminLotteryTemplates />
            </main>
        </div>
    );
}
