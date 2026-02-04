import LotteryDashboard from '../../components/lottery/LotteryDashboard';

export default function LotteryPage() {
    return (
        <div className="p-4 pt-4 pb-24 min-h-screen bg-[#0A2540]">
            <div className="flex items-center gap-3 mb-6">
                <a href="/dashboard" className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                </a>
                <h1 className="text-xl font-bold text-white">Lottery Center</h1>
            </div>
            <LotteryDashboard />
        </div>
    );
}
