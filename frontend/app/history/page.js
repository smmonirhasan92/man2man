import UnifiedHistory from '../../components/history/UnifiedHistory';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Earnings History | USA Affiliate',
    description: 'Track all your rewards and transactions.',
};

export default function HistoryPage() {
    return (
        <div className="w-full min-h-screen bg-[#050505] pb-40">

            {/* Page Header */}
            <div className="pt-20 pb-6 px-6 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition border border-white/10">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <span>Home</span>
                        <span className="text-slate-600">/</span>
                        <span>Profile</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-blue-500">History</span>
                    </div>
                </div>
                <h1 className="text-3xl font-black text-white">Earnings History</h1>
                <p className="text-slate-400 text-sm mt-1">Track all your rewards and transactions.</p>
            </div>

            {/* Main Content */}
            <div className="px-4">
                <UnifiedHistory />
            </div>
        </div>
    );
}
