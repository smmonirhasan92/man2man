'use client';
import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import GameWalletTransferModal from '../wallet/GameWalletTransferModal';

import Skeleton from '../ui/Skeleton';

export default function GameBalanceDisplay({ showLabel = true }) {
    const { user } = useAuth();
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    if (!user) {
        return <Skeleton width={100} height={32} className="rounded-full bg-white/5" />;
    }

    return (
        <>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
                {showLabel && <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">Game Wallet</span>}
                <span className="text-sm font-bold text-cyan-400">৳{Math.floor(user?.game_balance || 0).toLocaleString()}</span>
                <button
                    onClick={() => setIsTransferOpen(true)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-cyan-500 text-black text-xs font-bold leading-none hover:scale-110 transition-transform active:scale-95"
                    title="Transfer Funds"
                >
                    <Plus className="w-3 h-3" strokeWidth={4} />
                </button>
            </div>

            <GameWalletTransferModal
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
            />
        </>
    );
}
