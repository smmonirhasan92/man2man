"use client";
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Controls = ({ onAction, gameState, playerState }) => {
    const { currentTurn, pot } = gameState;
    const { isFolded, isSeen, currentBet } = playerState;

    // Only show if it is user's turn and not folded
    const isMyTurn = currentTurn === 0 && !isFolded;

    if (!isMyTurn) return null;

    return (
        <div className="absolute z-[60] bottom-24 right-4 md:bottom-10 md:right-auto md:left-1/2 md:-translate-x-1/2 flex flex-col md:flex-row items-end md:items-center gap-3 w-auto">

            {/* Pack / Fold */}
            <button
                onClick={() => onAction('pack')}
                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest shadow-xl border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all"
            >
                PACK
            </button>

            {/* Show / See Cards */}
            <button
                onClick={() => onAction('see')}
                className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest shadow-xl border-b-4 border-sky-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                disabled={isSeen}
            >
                {isSeen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isSeen ? 'SEEN' : 'SEE'}
            </button>

            {/* Chal / Bet */}
            <div className="flex flex-col gap-1 w-full md:w-auto">
                <button
                    onClick={() => onAction('chal')}
                    className="w-full md:w-auto bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white px-8 py-3 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(22,163,74,0.6)] border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wide"
                >
                    CHAL (+{currentBet})
                </button>
            </div>

            {/* Show (Available only if 2 players left) */}
            <button
                onClick={() => onAction('show')}
                className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl text-xs font-black tracking-widest shadow-xl border-b-4 border-yellow-900 active:border-b-0 active:translate-y-1 transition-all"
            >
                SHOW
            </button>

        </div>
    );
};

export default Controls;
