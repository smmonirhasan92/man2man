import UnifiedHistory from '../../components/history/UnifiedHistory';

export const metadata = {
    title: 'Earnings History | USA Affiliate',
    description: 'Track all your rewards and transactions.',
};

export default function HistoryPage() {
    return (
        <div className="w-full min-h-screen bg-[#050505] pb-24">

            {/* Page Header */}
            <div className="pt-20 pb-6 px-6 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Home</span>
                    <span className="text-slate-600">/</span>
                    <span>Profile</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-blue-500">History</span>
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
