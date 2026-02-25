'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCcw, TrendingUp, Shield, Users, Wallet, Flame, HardDrive, ScrollText } from 'lucide-react';
import AdminMintLogsModal from './AdminMintLogsModal';

export default function LiveVaultTracker() {
    const [vaults, setVaults] = useState({
        total_minted: 0,
        total_revoked: 0,
        net_created: 0,
        global_pool: 0, // system liability
        admin_profit: 0
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [showLogs, setShowLogs] = useState(false);

    const fetchVaults = async () => {
        try {
            const { data } = await api.get('/admin/live-vaults');
            if (data.status === 'LIVE') {
                setVaults(data.vaults);
                setLastUpdate(Date.now());
            }
        } catch (e) {
            console.error("Vault Sync Error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVaults();
        const interval = setInterval(fetchVaults, 5000); // 5 Seconds Polling
        return () => clearInterval(interval);
    }, []);

    const VaultCard = ({ title, amount, subtitle, icon: Icon, color }) => (
        <div className={`flex flex-col p-4 rounded-xl border ${color} bg-slate-900/50 backdrop-blur-sm shadow-lg`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Icon size={16} />
                    {title}
                </div>
                {subtitle && (
                    <div className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {subtitle}
                    </div>
                )}
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                <span className="text-sm text-slate-500">৳</span>
                {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="w-full h-1 bg-slate-800 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-current opacity-50 w-full animate-pulse" style={{ color: color.split('-')[1] }} />
            </div>
        </div>
    );

    return (
        <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <HardDrive className="text-blue-500" />
                    System Ledger & Minting
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50 animate-pulse">
                        LIVE SYNC
                    </span>
                </h2>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowLogs(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition border border-blue-400"
                    >
                        <ScrollText size={14} /> Minting Logs
                    </button>
                    <div className="text-xs text-slate-500 flex items-center gap-2 hidden sm:flex">
                        <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
                        Updated: <span suppressHydrationWarning>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Syncing...'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <VaultCard
                    title="Gross Minted"
                    amount={vaults.total_minted}
                    subtitle="ADMIN CREATED"
                    icon={TrendingUp}
                    color="border-blue-500/50 shadow-blue-500/10"
                />
                <VaultCard
                    title="System Liability"
                    amount={vaults.global_pool}
                    subtitle="USER WALLETS"
                    icon={Users}
                    color="border-yellow-500/50 shadow-yellow-500/10"
                />
                <VaultCard
                    title="Money Burned"
                    amount={vaults.total_revoked}
                    subtitle="ADMIN REVOKED"
                    icon={Flame}
                    color="border-red-500/50 shadow-red-500/10"
                />
                <VaultCard
                    title="Admin Profit"
                    amount={vaults.admin_profit}
                    subtitle="COMMISSION"
                    icon={Wallet}
                    color="border-green-500/50 shadow-green-500/10"
                />
            </div>

            {showLogs && <AdminMintLogsModal onClose={() => setShowLogs(false)} />}
        </div>
    );
}
