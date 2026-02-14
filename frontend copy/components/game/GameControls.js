import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const GameControls = ({
    choice, setChoice,
    betAmount, setBetAmount,
    minBet, maxBet,
    gameState,
    onPlay
}) => {
    return (
        <Card className="rounded-b-none rounded-t-[2.5rem] border-b-0 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] p-8 pb-10 z-20">
            {/* Height Choice (Head/Tail) */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setChoice('head')}
                    className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all duration-300 ${choice === 'head' ? 'border-yellow-500 bg-yellow-50 text-yellow-600 shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-70'}`}
                >
                    <span className="text-lg font-black">HEAD</span>
                </button>
                <button
                    onClick={() => setChoice('tail')}
                    className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all duration-300 ${choice === 'tail' ? 'border-yellow-500 bg-yellow-50 text-yellow-600 shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-70'}`}
                >
                    <span className="text-lg font-black">TAIL</span>
                </button>
            </div>

            {/* Bet Amount Slider & Presets */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-3">
                    <span>Bet Amount</span>
                    <span className="text-[#0056D2]">৳{betAmount}</span>
                </div>
                <input
                    type="range"
                    min={minBet}
                    max={maxBet}
                    step="10"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0056D2]"
                />
                <div className="flex justify-between mt-4">
                    {[20, 50, 100, 500].map(amt => (
                        <button
                            key={amt}
                            onClick={() => setBetAmount(amt)}
                            className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#0056D2] hover:text-white transition-colors"
                        >
                            {amt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Play Button */}
            <Button
                onClick={onPlay}
                disabled={gameState === 'flipping'}
                variant={gameState === 'flipping' ? 'ghost' : 'primary'}
                className="w-full text-lg py-5 shadow-xl"
            >
                {gameState === 'flipping' ? 'WAIT...' : `FLIP FOR ৳${betAmount * 2}`}
            </Button>
        </Card>
    );
};

export default GameControls;
