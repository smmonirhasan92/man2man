'use client';
import { useState } from 'react';
import P2PCommandCenter from '../../../components/admin/P2PCommandCenter';
import P2PMarketControl from '../../../components/admin/P2PMarketControl';
import { Shield, Activity } from 'lucide-react';

export default function P2PControlPage() {
    const [activeTab, setActiveTab] = useState('tribunal'); // 'tribunal' or 'market'

    return (
        <div className="p-4 h-[calc(100vh-100px)] bg-black overflow-hidden flex flex-col font-sans">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
                <h1 className="text-xl font-black text-slate-400 tracking-tight uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Mission Control: P2P Security
                </h1>

                <div className="flex bg-[#111] border border-white/10 rounded-lg p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('tribunal')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-md text-xs font-bold transition ${activeTab === 'tribunal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield className="w-4 h-4" /> Tribunal (Disputes)
                    </button>
                    <button
                        onClick={() => setActiveTab('market')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-md text-xs font-bold transition ${activeTab === 'market' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Activity className="w-4 h-4" /> Live Market Scanner
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'tribunal' && <P2PCommandCenter />}
                {activeTab === 'market' && <P2PMarketControl />}
            </div>

        </div>
    );
}
