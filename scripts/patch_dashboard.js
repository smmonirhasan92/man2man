const { execSync } = require('child_process');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

const patchScript = `
const fs = require('fs');
const filePath = '/var/www/man2man/frontend/app/admin/dashboard/page.js';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update loadData to include agentLiveStats
const oldLoadData = \`            const overview = finRes.data.overview || {};
            const actual = finRes.data.actual || {};
            const eco = finRes.data.economics || {};
            const partnerAudit = finRes.data.partnerAudit || {};

            setStats({
                ...eco,
                totalMinted: overview.total_minted || 0,
                currentLiabilities: actual.total_liability || 0,
                totalDeposits: overview.today_deposits || eco.totalDeposits || 0, // Fallback
                totalWithdraws: overview.today_withdraws || eco.totalWithdraws || 0, // Fallback
                pendingActions: (overview.pending_deposits || 0) + (overview.pending_withdraws || 0),
                communityDropFund: partnerAudit.communityDropFund || { total: 0 },
                adminReserveFund: eco.adminReserveFund || 0
            });\`;

const newLoadData = \`            const overview = finRes.data.overview || {};
            const actual = finRes.data.actual || {};
            const eco = finRes.data.economics || {};
            const partnerAudit = finRes.data.partnerAudit || {};
            const agentLive = finRes.data.agent_live_stats || {};

            setStats({
                ...eco,
                totalMinted: overview.total_minted || 0,
                currentLiabilities: actual.total_liability || 0,
                totalDeposits: overview.today_deposits || eco.totalDeposits || 0,
                totalWithdraws: overview.today_withdraws || eco.totalWithdraws || 0,
                pendingActions: (overview.pending_deposits || 0) + (overview.pending_withdraws || 0),
                communityDropFund: partnerAudit.communityDropFund || { total: 0 },
                adminReserveFund: eco.adminReserveFund || 0,
                agentLive: agentLive
            });\`;

if (code.includes('const overview = finRes.data.overview || {};')) {
    code = code.replace(
        /const partnerAudit = finRes\\.data\\.partnerAudit \\|\\| \\{\\};\\s*setStats\\(\\{[\\s\\S]*?adminReserveFund: eco\\.adminReserveFund \\|\\| 0\\s*\\}\\);/,
        \`const partnerAudit = finRes.data.partnerAudit || {};
            const agentLive = finRes.data.agent_live_stats || {};

            setStats({
                ...eco,
                totalMinted: overview.total_minted || 0,
                currentLiabilities: actual.total_liability || 0,
                totalDeposits: eco.totalDeposits || overview.today_deposits || 0,
                totalWithdraws: eco.totalWithdraws || overview.today_withdraws || 0,
                pendingActions: (overview.pending_deposits || 0) + (overview.pending_withdraws || 0),
                communityDropFund: partnerAudit.communityDropFund || { total: 0 },
                adminReserveFund: eco.adminReserveFund || 0,
                agentLive: agentLive
            });\`
    );
}

// 2. Replace the FINANCIAL STATUS GRID
const gridRegex = /\\{\\/\\* FINANCIAL STATUS GRID \\*\\/\\}[\\s\\S]*?(?=\\{\\/\\* DROP RESERVOIR BANNER - REIMAGINED \\*\\/\\})/;

const newGrid = \`{/* FINANCIAL STATUS GRID (ACCOUNTING MASTER VIEW) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                    {/* 1. ADMIN MASTER FUND */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-indigo-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Admin Master Fund
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Admin Minted (Total Created)</p>
                                <p className="text-2xl font-black text-white">{formatNXS(stats.totalMinted || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">System Liability (দায়দেনা)</p>
                                <p className="text-xl font-black text-rose-400">{formatNXS(stats.currentLiabilities || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Net Equity</p>
                                <p className={\`text-lg font-black \${(stats.totalMinted - stats.currentLiabilities) >= 0 ? 'text-emerald-400' : 'text-rose-500'}\`}>
                                    {formatNXS((stats.totalMinted || 0) - (stats.currentLiabilities || 0))}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. SYSTEM CASH FLOW */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Cash Flow
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total User Deposits (System)</p>
                                <p className="text-2xl font-black text-emerald-400">{formatNXS(stats.totalDeposits || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total User Withdraws</p>
                                <p className="text-xl font-black text-slate-300">{formatNXS(stats.totalWithdraws || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center bg-emerald-500/5 p-2 rounded-lg">
                                <p className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest">Today's Daily Volume</p>
                                <p className="text-sm font-black text-emerald-400">
                                    {formatNXS(
                                        (stats.agentLive?.cash_in_today || 0) + 
                                        (stats.agentLive?.p2p_volume_today || 0) + 
                                        (stats.agentLive?.package_sales_today || 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. LIABILITY GENERATION */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-rose-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 rotate-180" /> Generated Liabilities (Expenses)
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Ads / Task Income Generated</p>
                                <p className="text-2xl font-black text-rose-400">{formatNXS(stats.totalTaskIncome || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Referral Paid</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS(stats.totalReferralBonus || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Game/Lottery Paid</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS((stats.totalGameWins || 0) + (stats.totalLotteryPrizes || 0))}</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. SYSTEM REVENUE */}
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-amber-500/20 p-8 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> System Revenues
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Package Purchases (Revenue)</p>
                                <p className="text-2xl font-black text-amber-400">{formatNXS(stats.totalServerRevenue || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">P2P Fees Collected</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS(stats.totalP2PFee || 0)}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between">
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Game / Lottery Revenue</p>
                                <p className="text-sm font-black text-slate-300">{formatNXS((stats.totalGameBets || 0) + (stats.totalLotteryRevenue || 0))}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* ACCOUNTING SUMMARY WIDGET */}
                <div className="bg-gradient-to-r from-[#0b1221] to-indigo-900/40 border border-white/10 rounded-3xl p-6 mb-12 flex justify-between items-center shadow-2xl">
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-sm">Net System Accounting Profit</h4>
                        <p className="text-slate-400 text-xs mt-1">Total System Revenue minus Generated Liabilities</p>
                    </div>
                    <div className={\`text-4xl font-black tracking-tighter \${stats.netSystemProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                        {stats.netSystemProfit >= 0 ? '+' : ''}{formatNXS(stats.netSystemProfit || 0)}
                    </div>
                </div>

                `;

code = code.replace(gridRegex, newGrid);

fs.writeFileSync(filePath, code);
console.log('✅ Dashboard patched successfully!');
`;

try {
    const b64 = Buffer.from(patchScript).toString('base64');
    SSH("printf '%s' '" + b64 + "' | base64 -d > /tmp/patch_dashboard.js");
    console.log(SSH('node /tmp/patch_dashboard.js'));
    
    console.log('Rebuilding frontend container...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend`);
    console.log('✅ Frontend dashboard successfully updated.');
} catch (e) {
    console.error('Error:', e.message);
}
