'use client';
import Link from 'next/link';
import { Gamepad2, ArrowLeft, RotateCcw, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import GameWalletSheet from '../../components/GameWalletSheet';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useEffect } from 'react'; // Added useEffect
import useGameSound from '../../hooks/useGameSound'; // Added Hook
import CoinAnimation from '../../components/game/CoinAnimation';
import GameControls from '../../components/game/GameControls';

export default function GamePage() {
    const {
        choice, setChoice,
        betAmount, setBetAmount,
        minBet, maxBet,
        gameState, result, coinSide,
        gameBalance, mainBalance,
        showTransfer, setShowTransfer,
        showToast,
        isMaintenance,
        handlePlay,
        handleTransferSuccess
    } = useGameLogic();

    // Sound Effects
    const { playClick, playWin, playLose } = useGameSound();

    // Trigger sounds based on state changes
    useEffect(() => {
        if (gameState === 'flipping') playClick(); // Or a flip sound
        if (gameState === 'result') {
            if (result === 'win') playWin();
            else playLose();
        }
    }, [gameState, result]);

    return (
        <div className="flex flex-col h-screen bg-[#F9FAFB] text-slate-800 overflow-hidden font-sans">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-white shadow-sm z-10 border-b border-slate-100">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-50">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex flex-col items-center">
                    <span className="font-extrabold text-lg tracking-wider text-[#0056D2]">COIN FLIP</span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-widest">WIN 2X</span>
                </div>
                <div onClick={() => setShowTransfer(true)} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full cursor-pointer border border-slate-200 hover:border-[#0056D2] transition-colors">
                    <Gamepad2 className="w-4 h-4 text-[#0056D2]" />
                    <span className="font-mono font-bold text-slate-700">৳{Number(gameBalance).toFixed(0)}</span>
                    <Plus className="w-4 h-4 bg-[#0056D2] text-white rounded-full p-0.5" />
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-[url('/grid-pattern.svg')]">

                {/* Success Toast */}
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                    <div className="bg-green-500 text-white px-6 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2">
                        <div className="bg-white rounded-full p-0.5"><Plus className="w-3 h-3 text-green-500" /></div>
                        Transfer Successful!
                    </div>
                </div>

                {/* Animation Component */}
                <CoinAnimation gameState={gameState} coinSide={coinSide} />

                {/* Result Message */}
                <div className="h-16 flex items-center justify-center">
                    {gameState === 'result' && (
                        <div className={`text-3xl font-black tracking-widest animate-bounce ${result === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                            {result === 'win' ? 'YOU WON!' : 'TRY AGAIN'}
                        </div>
                    )}
                    {gameState === 'flipping' && (
                        <div className="text-[#FF6F00] font-bold tracking-widest animate-pulse">FLIPPING...</div>
                    )}
                </div>

                {/* Maintenance Overlay */}
                {isMaintenance && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <RotateCcw className="w-12 h-12 text-[#FF6F00] mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800">Under Maintenance</h2>
                        <Button onClick={() => window.location.reload()} variant="primary" className="mt-6">Refresh</Button>
                    </div>
                )}
            </div>

            {/* Controls Component */}
            <GameControls
                choice={choice}
                setChoice={setChoice}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                minBet={minBet}
                maxBet={maxBet}
                gameState={gameState}
                onPlay={handlePlay}
            />

            <GameWalletSheet
                isOpen={showTransfer}
                onClose={() => setShowTransfer(false)}
                mainBalance={mainBalance}
                gameBalance={gameBalance}
                onSuccess={handleTransferSuccess}
            />
        </div>
    );
}
