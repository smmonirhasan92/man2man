import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SpinWheelModal({ onClose, onComplete }) {
    const [spinning, setSpinning] = useState(false);
    const [reward, setReward] = useState(null);
    const [rotation, setRotation] = useState(0);

    const handleSpin = async () => {
        if (spinning) return;
        setSpinning(true);

        try {
            const res = await api.post('/task/spin');
            // The mathematical reward from the backend (e.g. 1.25 NXS)
            const wonAmount = res.data.reward;

            // Visual spin math
            const extraSpins = 5 * 360; // 5 full spins
            const randomOffset = Math.floor(Math.random() * 360);

            setRotation(prev => prev + extraSpins + randomOffset);

            setTimeout(() => {
                setReward(wonAmount);
            }, 3000); // Wait for 3s CSS transition to finish

        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to spin");
            setSpinning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#0A2540] border border-blue-500/30 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                {!reward && (
                    <button onClick={onClose} disabled={spinning} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 transition-colors">
                        <X />
                    </button>
                )}

                <div className="text-center mb-8 relative z-10">
                    <h3 className="text-2xl font-black text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-600 drop-shadow-sm">Daily Bonus Spin</h3>
                    <p className="text-sm text-slate-400 mt-2 font-medium">Spin the wheel to win up to 3 NXS!</p>
                </div>

                {!reward ? (
                    <div className="flex flex-col items-center relative z-10">
                        {/* The Wheel */}
                        <div className="relative w-64 h-64 mb-10">
                            {/* Pointer (Top Center) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 text-red-500 text-4xl filter drop-shadow-[0_0_15px_rgba(239,68,68,1)]">📍</div>

                            {/* Wheel Spinner Background */}
                            <div
                                className="w-full h-full rounded-full border-4 border-slate-700 shadow-[0_0_40px_rgba(59,130,246,0.3)] relative overflow-hidden bg-slate-800"
                                style={{
                                    transition: 'transform 3s cubic-bezier(0.15, 0.85, 0.3, 1)',
                                    transform: `rotate(${rotation}deg)`
                                }}
                            >
                                {/* Vivid Multi-color segments using conic gradient */}
                                <div className="absolute inset-0 rounded-full" style={{
                                    background: 'conic-gradient(#ec4899 0deg 60deg, #3b82f6 60deg 120deg, #8b5cf6 120deg 180deg, #10b981 180deg 240deg, #f59e0b 240deg 300deg, #ef4444 300deg 360deg)'
                                }}></div>

                                {/* Inner Details */}
                                <div className="absolute inset-[20%] rounded-full bg-[#0A2540] shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] flex items-center justify-center border-4 border-slate-800">
                                    <Gift size={48} className="text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSpin}
                            disabled={spinning}
                            className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest transition-all duration-300 ${spinning ? 'bg-slate-700/50 text-slate-500 scale-95 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(79,70,229,0.6)]'}`}
                        >
                            {spinning ? 'Good Luck! 🍀' : 'SPIN NOW'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-6 animate-in zoom-in slide-in-from-bottom-8 duration-500 spring-bounce-50">
                        <div className="text-7xl mb-6 animate-bounce">🎉</div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">You Won!</h2>
                        <div className="text-6xl font-black text-amber-400 mb-8 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)] font-mono">
                            {reward} <span className="text-2xl text-amber-500">NXS</span>
                        </div>
                        <button
                            onClick={() => {
                                onComplete(reward);
                                onClose();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl font-black text-white uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all"
                        >
                            Claim Reward
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
