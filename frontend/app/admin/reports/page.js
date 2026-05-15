'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { 
    ArrowDownLeft, ArrowUpRight, Package, Users, RefreshCw, 
    TrendingUp, TrendingDown, Calendar, Clock, Wallet,
    ChevronDown, ChevronUp, Gift
} from 'lucide-react';

const NXS_RATE = 100; // 1 USD = 100 NXS
const formatNXS = (val) => `${(val || 0).toFixed(2)} NXS`;
const formatBDT = (nxs) => `BDT ${((nxs || 0) / NXS_RATE * 110).toFixed(0)}`;
const formatTime = (d) => new Date(d).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka', hour12: true, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const StatCard = ({ icon: Icon, label, nxs, count, color, trend }) => (
    <div className={`bg-[#0b1221]/90 border ${color} rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden`}>
        <div className="flex items-center justify-between">
            <div className={`p-2 rounded-xl ${color.replace('border-', 'bg-').replace('/30', '/15')}`}>
                <Icon className={`w-5 h-5 ${color.replace('border-', 'text-').replace('/30', '')}`} />
            </div>
            {count !== undefined && (
                <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-1 rounded-full">{count} txns</span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{label}</p>
            <p className={`text-xl font-black mt-1 ${color.replace('border-', 'text-').replace('/30', '')}`}>{formatNXS(nxs)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{formatBDT(nxs)} (approx)</p>
        </div>
    </div>
);

const PeriodSection = ({ title, icon: Icon, data, color }) => {
    const [open, setOpen] = useState(true);
    if (!data) return null;
    const profit = (data.deposits?.total || 0) + (data.packages?.total || 0) - (data.withdrawals?.total || 0) - (data.referralPaid?.total || 0);
    return (
        <div className={`bg-[#080f1e] border ${color} rounded-3xl overflow-hidden`}>
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color.replace('border-', 'text-').replace('/30', '')}`} />
                    <h2 className="font-black text-white text-lg">{title}</h2>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${profit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        Net: {profit >= 0 ? '+' : ''}{formatNXS(profit)}
                    </span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && (
                <div className="p-5 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={ArrowDownLeft} label="Deposits" nxs={data.deposits?.total} count={data.deposits?.count} color="border-emerald-500/30" />
                    <StatCard icon={ArrowUpRight} label="Withdrawals" nxs={data.withdrawals?.total} count={data.withdrawals?.count} color="border-rose-500/30" />
                    <StatCard icon={Package} label="Packages Sold" nxs={data.packages?.total} count={data.packages?.count} color="border-amber-500/30" />
                    <StatCard icon={Gift} label="Referral Bonus Paid" nxs={data.referralPaid?.total} count={data.referralPaid?.count} color="border-purple-500/30" />
                    <div className="col-span-2 md:col-span-4 bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">New Users Registered</p>
                            <p className="text-2xl font-black text-white">{data.newUsers || 0} <span className="text-xs text-slate-500">users</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cash Flow (Deposit - Withdrawal)</p>
                            <p className={`text-2xl font-black ${(data.netFlow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {(data.netFlow || 0) >= 0 ? '+' : ''}{formatNXS(data.netFlow)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function DailyReportPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [financials, setFinancials] = useState(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const [reportRes, finRes] = await Promise.all([
                api.get('/admin/stats/daily-report'),
                api.get('/admin/stats/financial')
            ]);
            setReport(reportRes.data);
            setFinancials(finRes.data);
            setLastUpdated(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    return (
        <div className="min-h-screen bg-[#050d1a] p-6 text-white pb-20">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-cyan-400" />
                        Cash Flow Report
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Today's, Weekly & Monthly financial summary — real-time from database</p>
                </div>
                <div className="flex items-center gap-4">
                    {lastUpdated && (
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(lastUpdated)}
                        </span>
                    )}
                    <button onClick={fetchReport} disabled={loading} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {loading && !report ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                        <p className="text-slate-400">Loading report data...</p>
                    </div>
                </div>
            ) : report ? (
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* MASTER LEDGER (GLOBAL LIABILITY) */}
                    {financials && financials.overview && (
                        <div className="bg-[#080f1e] border border-fuchsia-500/30 rounded-3xl overflow-hidden mb-8">
                            <div className="p-5 border-b border-white/5 flex items-center gap-3">
                                <Wallet className="w-5 h-5 text-fuchsia-400" />
                                <h2 className="font-black text-white text-lg">Master Ledger (Global Overview)</h2>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Minted (Admin Created)</p>
                                    <p className="text-2xl font-black text-white">{formatNXS(financials.overview.total_minted)}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Total NXS generated by Admin.</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-rose-500/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                                    <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Liability (User Wallets)</p>
                                    <p className="text-2xl font-black text-rose-400">{formatNXS(financials.overview.current_liabilities)}</p>
                                    <p className="text-[10px] text-rose-500/70 mt-1">Total NXS users currently hold (Owed).</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Real Deposits</p>
                                    <p className="text-2xl font-black text-emerald-400">{formatNXS(financials.authorized?.total_deposits)}</p>
                                    <p className="text-[10px] text-emerald-500/70 mt-1">Total real money injected by users.</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-purple-500/30">
                                    <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-1">Admin Reserve (Fees Collected)</p>
                                    <p className="text-2xl font-black text-purple-400">{formatNXS(financials.economics?.adminReserveFund)}</p>
                                    <p className="text-[10px] text-purple-500/70 mt-1">Total system fees collected.</p>
                                </div>
                                <div className="col-span-1 md:col-span-2 bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Net Equity</p>
                                        <p className="text-xl font-black text-white">{formatNXS(financials.overview.net_system_equity)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Earned By Users (Mining/Bonus)</p>
                                        <p className="text-xl font-black text-amber-400">{formatNXS(financials.authorized?.net_game_creation)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TODAY */}
                    <PeriodSection 
                        title="Today's Report" 
                        icon={Clock} 
                        data={report.today} 
                        color="border-cyan-500/30"
                    />

                    {/* THIS WEEK */}
                    <PeriodSection 
                        title="Last 7 Days" 
                        icon={TrendingUp} 
                        data={report.week} 
                        color="border-indigo-500/30"
                    />

                    {/* THIS MONTH */}
                    <PeriodSection 
                        title="This Month" 
                        icon={Calendar} 
                        data={report.month} 
                        color="border-amber-500/30"
                    />

                    {/* RECENT TRANSACTIONS SIDE BY SIDE */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Withdrawals */}
                        <div className="bg-[#080f1e] border border-rose-500/20 rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center gap-3">
                                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                                <h2 className="font-black text-white">Last 10 Withdrawals</h2>
                            </div>
                            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                                {report.recentWithdrawals?.length === 0 ? (
                                    <p className="text-slate-500 text-center p-6 text-sm">No withdrawals yet</p>
                                ) : report.recentWithdrawals?.map((t) => (
                                    <div key={t._id} className="p-4 hover:bg-white/5 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-white text-sm">{t.userId?.fullName || 'Unknown'}</p>
                                                <p className="text-slate-500 text-[10px]">@{t.userId?.username} • {t.userId?.phone}</p>
                                                <p className="text-slate-500 text-[10px] mt-0.5">{t.recipientDetails}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-rose-400 font-black">{formatNXS(Math.abs(t.amount))}</p>
                                                <p className="text-slate-500 text-[10px]">{formatBDT(Math.abs(t.amount))}</p>
                                                <p className="text-slate-600 text-[10px]">{formatTime(t.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Deposits */}
                        <div className="bg-[#080f1e] border border-emerald-500/20 rounded-3xl overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center gap-3">
                                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                                <h2 className="font-black text-white">Last 10 Deposits</h2>
                            </div>
                            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                                {report.recentDeposits?.length === 0 ? (
                                    <p className="text-slate-500 text-center p-6 text-sm">No deposits yet</p>
                                ) : report.recentDeposits?.map((t) => (
                                    <div key={t._id} className="p-4 hover:bg-white/5 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-white text-sm">{t.userId?.fullName || 'Unknown'}</p>
                                                <p className="text-slate-500 text-[10px]">@{t.userId?.username} • {t.userId?.phone}</p>
                                                <p className="text-slate-500 text-[10px] mt-0.5">{t.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-emerald-400 font-black">{formatNXS(Math.abs(t.amount))}</p>
                                                <p className="text-slate-500 text-[10px]">{formatBDT(Math.abs(t.amount))}</p>
                                                <p className="text-slate-600 text-[10px]">{formatTime(t.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-rose-400 font-bold py-20">Failed to load report. Please try refreshing.</div>
            )}
        </div>
    );
}
