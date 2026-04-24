'use client';
import { useState, useEffect } from 'react';
import { Users, AlertCircle, Share2, Award, Zap } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';

export default function ReferralNetworkUI() {
    const [networkData, setNetworkData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                const res = await api.get('/user/network-summary');
                setNetworkData(res.data);
            } catch (err) {
                setError('Failed to load network data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNetwork();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800/20 rounded-2xl border border-white/5 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mb-4" />
                <p className="text-slate-400 text-xs font-mono font-bold uppercase tracking-widest">Scanning Network Empire...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-red-400 text-xs font-bold uppercase">{error}</p>
            </div>
        );
    }

    const { totalNetworkSize, levelCounts } = networkData;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center mb-8">
                <div className="bg-slate-800/50 p-3 rounded-2xl mb-3 shadow-inner border border-white/5">
                    <Share2 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest drop-shadow-md">
                    Referral Empire
                </h3>
                <p className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1">
                    5-Tier Global Network
                </p>

                <div className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/20 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-3xl font-black text-white tracking-tighter">
                        {totalNetworkSize}
                    </span>
                    <span className="text-blue-300/80 text-[10px] font-bold uppercase tracking-widest mt-1">Members</span>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                {[
                    { level: 1, label: 'Direct Referrals', value: levelCounts.level1, earning: networkData.levelEarnings[0], color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Award },
                    { level: 2, label: 'Tier 2 Members', value: levelCounts.level2, earning: networkData.levelEarnings[1], color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Users },
                    { level: 3, label: 'Tier 3 Squad', value: levelCounts.level3, earning: networkData.levelEarnings[2], color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Users },
                    { level: 4, label: 'Tier 4 Network', value: levelCounts.level4, earning: networkData.levelEarnings[3], color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Users },
                    { level: 5, label: 'Tier 5 Reach', value: levelCounts.level5, earning: networkData.levelEarnings[4], color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Zap },
                ].map((tier, idx) => (
                    <motion.div
                        key={tier.level}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-2xl border ${tier.border} ${tier.bg} backdrop-blur-sm shadow-inner`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-slate-950/50 shadow-sm border border-white/5`}>
                                <tier.icon className={`w-4 h-4 ${tier.color}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white tracking-widest uppercase">
                                    Levels {tier.level}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">
                                    {tier.label}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className={`text-xl font-black ${tier.color} tracking-tighter drop-shadow-sm`}>
                                {tier.value}
                            </span>
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">
                                Profit: <span className="text-emerald-400">{tier.earning.toFixed(2)}</span> NXS
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Network Sync Active
            </div>
        </div>
    );
}
