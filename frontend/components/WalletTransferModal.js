import { useState } from 'react';
import { X, ArrowRightLeft, Wallet, Gamepad2 } from 'lucide-react';
import USCIcon from './ui/USCIcon';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function WalletTransferModal({ isOpen, onClose, onSuccess, mainBalance, gameBalance, incomeBalance }) {
    const [direction, setDirection] = useState('to_game'); // 'to_game' | 'to_main' | 'income_to_main'
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let endpoint = '/wallet/transfer/game'; // default
            if (direction === 'to_main') endpoint = '/wallet/transfer/main'; // game -> main (actually endpoint for income->main is same? Wait check routes)

            // Logic check:
            // Route /wallet/transfer/main is "Income to Main" (based on WalletController line 150)
            // Route /wallet/withdraw-game is "Game to Main" (based on WalletController line 212)

            if (direction === 'to_game') {
                endpoint = '/wallet/transfer/game';
            } else if (direction === 'to_main') {
                endpoint = '/wallet/withdraw-game';
            } else if (direction === 'income_to_main') {
                endpoint = '/wallet/transfer/main';
            }

            await api.post(endpoint, { amount });
            onSuccess();
            onClose();
            setAmount('');
            toast.success('Transfer successful!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1b2e] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 text-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">Transfer Funds</h3>
                    <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Main</span>
                        <span className="text-sm font-bold flex items-center justify-center gap-1"><USCIcon className="w-3 h-3" /> {mainBalance || 0}</span>
                    </div>
                    <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20 text-center">
                        <span className="text-[9px] uppercase font-bold text-purple-300 block mb-1">Game</span>
                        <span className="text-sm font-bold text-purple-300 flex items-center justify-center gap-1"><USCIcon className="w-3 h-3" /> {gameBalance || 0}</span>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20 text-center">
                        <span className="text-[9px] uppercase font-bold text-green-300 block mb-1">Income</span>
                        <span className="text-sm font-bold text-green-300 flex items-center justify-center gap-1"><USCIcon className="w-3 h-3" /> {incomeBalance || 0}</span>
                    </div>
                </div>

                {/* Direction Selector */}
                <div className="space-y-2 mb-6">
                    <button
                        onClick={() => setDirection('income_to_main')}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${direction === 'income_to_main' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-transparent text-slate-400'}`}
                    >
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Income → Main Wallet</span>
                        </div>
                        {direction === 'income_to_main' && <CheckCircle className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={() => setDirection('to_game')}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${direction === 'to_game' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-transparent text-slate-400'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4" />
                            <span>Main → Game Wallet</span>
                        </div>
                        {direction === 'to_game' && <CheckCircle className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={() => setDirection('to_main')}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${direction === 'to_main' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-transparent text-slate-400'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            <span>Game → Main Wallet</span>
                        </div>
                        {direction === 'to_main' && <CheckCircle className="w-4 h-4" />}
                    </button>
                </div>

                <form onSubmit={handleTransfer} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                            Amount to Transfer ({direction === 'to_game' ? 'Main → Game' : 'Game → Main'})
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-bold text-xl outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 font-bold rounded-xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Transfer Now'}
                    </button>
                </form>
            </div>
        </div>
    );
}
