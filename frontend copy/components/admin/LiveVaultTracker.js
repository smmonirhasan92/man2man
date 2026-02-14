'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCcw, TrendingUp, Shield, Users, Wallet } from 'lucide-react';

export default function LiveVaultTracker() {
    const [vaults, setVaults] = useState({
        admin_profit: 0,
        investor_platform: 0,
        system_fund: 0,
        global_pool: 0
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

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

    const VaultCard = ({ title, amount, percent, icon: Icon, color }) => (
        <div className={`flex flex-col p-4 rounded-xl border ${color} bg-slate-900/50 backdrop-blur-sm shadow-lg`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
                    <Icon size={16} />
                    {title}
                </div>
                <div className="text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {percent}
                </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                <span className="text-sm text-slate-500">৳</span>
                {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="w-full h-1 bg-slate-800 mt-3 rounded-full overflow-hidden">
                {/* Fake progress bar/activity indicator */}
                <div className="h-full bg-current opacity-50 w-full animate-pulse" style={{ color: color.split('-')[1] }} />
            </div>
        </div>
    );

    return (
        <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Users className="text-blue-500" />
                    Live Vault Tracker
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50 animate-pulse">
                        LIVE SYNC
                    </span>
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                    <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
                    Updated: <span suppressHydrationWarning>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Syncing...'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <VaultCard
                    title="Global Prize Pool"
                    amount={vaults.global_pool}
                    percent="90%"
                    icon={TrendingUp}
                    color="border-yellow-500/50 shadow-yellow-500/10"
                />
                <VaultCard
                    title="Investor Platform"
                    amount={vaults.investor_platform}
                    percent="4%"
                    icon={Users}
                    color="border-blue-500/50 shadow-blue-500/10"
                />
                <VaultCard
                    title="System Fund"
                    amount={vaults.system_fund}
                    percent="3%"
                    icon={Shield}
                    color="border-purple-500/50 shadow-purple-500/10"
                />
                <VaultCard
                    title="Admin Profit"
                    amount={vaults.admin_profit}
                    percent="3%"
                    icon={Wallet}
                    color="border-green-500/50 shadow-green-500/10"
                />
            </div>
        </div>
    );
}
